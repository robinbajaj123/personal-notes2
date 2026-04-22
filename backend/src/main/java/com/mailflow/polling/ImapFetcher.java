package com.mailflow.polling;

import com.mailflow.account.EmailAccount;
import com.mailflow.config.EncryptionService;
import jakarta.mail.*;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMultipart;
import jakarta.mail.search.ComparisonTerm;
import jakarta.mail.search.UIDTerm;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Instant;
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class ImapFetcher {

    private final EncryptionService encryption;

    public List<FetchedEmail> fetchNewEmails(EmailAccount account) {
        String password = encryption.decrypt(account.getImapPasswordEncrypted());

        Properties props = buildImapProperties(account);
        Session session = Session.getInstance(props);

        List<FetchedEmail> results = new ArrayList<>();

        try (Store store = session.getStore("imaps")) {
            store.connect(account.getImapHost(), account.getImapUser(), password);

            try (Folder folder = store.getFolder("INBOX")) {
                folder.open(Folder.READ_ONLY);

                UIDFolder uidFolder = (UIDFolder) folder;
                long lastUID = account.getLastSeenUID();
                long newMaxUID = lastUID;

                Message[] messages;
                if (lastUID == 0) {
                    // first poll — fetch last 50 to bootstrap
                    int total = folder.getMessageCount();
                    int start = Math.max(1, total - 49);
                    messages = folder.getMessages(start, total);
                } else {
                    messages = uidFolder.getMessagesByUID(lastUID + 1, UIDFolder.LASTUID);
                }

                FetchProfile fp = new FetchProfile();
                fp.add(FetchProfile.Item.ENVELOPE);
                fp.add(FetchProfile.Item.CONTENT_INFO);
                fp.add(UIDFolder.FetchProfileItem.UID);
                folder.fetch(messages, fp);

                for (Message msg : messages) {
                    try {
                        long uid = uidFolder.getUID(msg);
                        FetchedEmail fetched = parseMessage(msg, uid, account);
                        results.add(fetched);
                        if (uid > newMaxUID) newMaxUID = uid;
                    } catch (Exception e) {
                        log.warn("Failed to parse message in account {}: {}", account.getId(), e.getMessage());
                    }
                }

                // store max UID back so caller can persist it
                if (!results.isEmpty()) {
                    results.get(results.size() - 1).setMaxUidSeen(newMaxUID);
                }
            }
        } catch (Exception e) {
            log.error("IMAP fetch failed for account {}: {}", account.getId(), e.getMessage());
        }

        return results;
    }

    private FetchedEmail parseMessage(Message msg, long uid, EmailAccount account) throws Exception {
        String from = extractAddress(msg.getFrom());
        List<String> to = extractAddresses(msg.getRecipients(Message.RecipientType.TO));
        List<String> cc = extractAddresses(msg.getRecipients(Message.RecipientType.CC));
        String subject = msg.getSubject() != null ? msg.getSubject() : "(no subject)";
        Instant receivedAt = msg.getReceivedDate() != null
                ? msg.getReceivedDate().toInstant()
                : Instant.now();

        String[] bodyParts = extractBody(msg);

        return FetchedEmail.builder()
                .uid(uid)
                .accountId(account.getId())
                .userId(account.getUserId())
                .messageId(getHeader(msg, "Message-ID"))
                .from(from)
                .to(to)
                .cc(cc)
                .subject(subject)
                .bodyText(bodyParts[0])
                .bodyHtml(bodyParts[1])
                .receivedAt(receivedAt)
                .isRead(msg.isSet(Flags.Flag.SEEN))
                .maxUidSeen(uid)
                .build();
    }

    private String[] extractBody(Part part) throws MessagingException, IOException {
        String text = "";
        String html = "";

        if (part.isMimeType("text/plain")) {
            text = (String) part.getContent();
        } else if (part.isMimeType("text/html")) {
            html = (String) part.getContent();
        } else if (part.isMimeType("multipart/*")) {
            MimeMultipart mp = (MimeMultipart) part.getContent();
            for (int i = 0; i < mp.getCount(); i++) {
                String[] sub = extractBody(mp.getBodyPart(i));
                if (!sub[0].isEmpty()) text = sub[0];
                if (!sub[1].isEmpty()) html = sub[1];
            }
        }
        return new String[]{text, html};
    }

    private String extractAddress(Address[] addresses) {
        if (addresses == null || addresses.length == 0) return "";
        Address addr = addresses[0];
        if (addr instanceof InternetAddress ia) {
            return ia.getAddress();
        }
        return addr.toString();
    }

    private List<String> extractAddresses(Address[] addresses) {
        if (addresses == null) return List.of();
        List<String> result = new ArrayList<>();
        for (Address addr : addresses) {
            if (addr instanceof InternetAddress ia) {
                result.add(ia.getAddress());
            } else {
                result.add(addr.toString());
            }
        }
        return result;
    }

    private String getHeader(Message msg, String name) {
        try {
            String[] headers = msg.getHeader(name);
            return headers != null && headers.length > 0 ? headers[0] : null;
        } catch (MessagingException e) {
            return null;
        }
    }

    private Properties buildImapProperties(EmailAccount account) {
        Properties props = new Properties();
        if (account.isImapSsl()) {
            props.put("mail.store.protocol", "imaps");
            props.put("mail.imaps.host", account.getImapHost());
            props.put("mail.imaps.port", account.getImapPort());
            props.put("mail.imaps.ssl.enable", "true");
        } else {
            props.put("mail.store.protocol", "imap");
            props.put("mail.imap.host", account.getImapHost());
            props.put("mail.imap.port", account.getImapPort());
        }
        props.put("mail.imaps.connectiontimeout", "10000");
        props.put("mail.imaps.timeout", "10000");
        return props;
    }
}
