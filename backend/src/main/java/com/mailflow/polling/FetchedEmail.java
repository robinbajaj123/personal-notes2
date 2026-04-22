package com.mailflow.polling;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;

@Data
@Builder
public class FetchedEmail {
    private long uid;
    private long maxUidSeen;
    private String accountId;
    private String userId;
    private String messageId;
    private String from;
    private List<String> to;
    private List<String> cc;
    private String subject;
    private String bodyText;
    private String bodyHtml;
    private Instant receivedAt;
    private boolean isRead;
}
