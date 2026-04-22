package com.mailflow.account;

import com.mailflow.config.EncryptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository repo;
    private final EncryptionService encryption;

    public List<EmailAccount> getAccounts(String userId) {
        return repo.findByUserId(userId);
    }

    public EmailAccount createAccount(AccountRequest req) {
        EmailAccount account = new EmailAccount();
        account.setUserId(req.getUserId());
        account.setLabel(req.getLabel());
        account.setImapHost(req.getImapHost());
        account.setImapPort(req.getImapPort());
        account.setImapSsl(req.isImapSsl());
        account.setImapUser(req.getImapUser());
        account.setImapPasswordEncrypted(encryption.encrypt(req.getImapPassword()));
        account.setSmtpHost(req.getSmtpHost());
        account.setSmtpPort(req.getSmtpPort());
        account.setSmtpSsl(req.isSmtpSsl());
        account.setSmtpUser(req.getSmtpUser());
        account.setSmtpPasswordEncrypted(encryption.encrypt(req.getSmtpPassword()));
        account.setFromAddress(req.getFromAddress());
        account.setFromName(req.getFromName());
        account.setProvider(req.getProvider());
        account.setLastSeenUID(0);
        return repo.save(account);
    }

    public void deleteAccount(String id) {
        repo.deleteById(id);
    }
}
