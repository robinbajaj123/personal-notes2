package com.mailflow.polling;

import com.mailflow.account.AccountRepository;
import com.mailflow.account.EmailAccount;
import com.mailflow.es.EmailDocument;
import com.mailflow.es.EmailRepository;
import com.mailflow.websocket.EmailEventBroadcaster;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class EmailIndexingPipeline {

    private final EmailRepository emailRepo;
    private final AccountRepository accountRepo;
    private final EmailEventBroadcaster broadcaster;

    public void process(List<FetchedEmail> emails, EmailAccount account) {
        if (emails.isEmpty()) return;

        long maxUID = account.getLastSeenUID();

        for (FetchedEmail email : emails) {
            try {
                EmailDocument doc = toDocument(email);
                emailRepo.save(doc);
                broadcaster.broadcastNewEmail(email.getUserId(), doc);
                if (email.getMaxUidSeen() > maxUID) {
                    maxUID = email.getMaxUidSeen();
                }
            } catch (Exception e) {
                log.error("Failed to index email uid={} account={}: {}", email.getUid(), account.getId(), e.getMessage());
            }
        }

        account.setLastSeenUID(maxUID);
        account.setLastPolledAt(Instant.now());
        accountRepo.save(account);
        log.debug("Indexed {} emails for account {}, new lastSeenUID={}", emails.size(), account.getId(), maxUID);
    }

    private EmailDocument toDocument(FetchedEmail email) {
        return EmailDocument.builder()
                .id(email.getAccountId() + "_" + email.getUid())
                .userId(email.getUserId())
                .accountId(email.getAccountId())
                .messageId(email.getMessageId())
                .from(email.getFrom())
                .to(email.getTo())
                .cc(email.getCc())
                .subject(email.getSubject())
                .bodyText(email.getBodyText())
                .bodyHtml(email.getBodyHtml())
                .isRead(email.isRead())
                .receivedAt(email.getReceivedAt())
                .build();
    }
}
