package com.mailflow.account;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Document(collection = "accounts")
public class EmailAccount {

    @Id
    private String id;

    private String userId;
    private String label;

    private String imapHost;
    private int imapPort;
    private boolean imapSsl;
    private String imapUser;
    private String imapPasswordEncrypted;

    private String smtpHost;
    private int smtpPort;
    private boolean smtpSsl;
    private String smtpUser;
    private String smtpPasswordEncrypted;

    private String fromAddress;
    private String fromName;

    private String provider; // gmail | outlook | other

    private Instant lastPolledAt;
    private long lastSeenUID;
}
