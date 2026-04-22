package com.mailflow.polling;

import com.mailflow.account.AccountRepository;
import com.mailflow.account.EmailAccount;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class ImapPollerScheduler {

    private final AccountRepository accountRepo;
    private final ImapFetcher fetcher;
    private final EmailIndexingPipeline pipeline;

    @Scheduled(fixedDelayString = "${mailflow.imap-poll-interval-ms:60000}")
    public void pollAllAccounts() {
        List<EmailAccount> accounts = accountRepo.findAll();
        log.debug("IMAP poll starting for {} accounts", accounts.size());

        for (EmailAccount account : accounts) {
            try {
                List<FetchedEmail> emails = fetcher.fetchNewEmails(account);
                pipeline.process(emails, account);
            } catch (Exception e) {
                log.error("Poll failed for account {}: {}", account.getId(), e.getMessage());
            }
        }
    }
}
