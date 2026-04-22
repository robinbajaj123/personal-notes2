package com.mailflow.websocket;

import com.mailflow.es.EmailDocument;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class EmailEventBroadcaster {

    private final SimpMessagingTemplate messagingTemplate;

    public void broadcastNewEmail(String userId, EmailDocument doc) {
        Map<String, Object> event = Map.of(
                "type", "NEW_EMAIL",
                "payload", Map.of(
                        "id", doc.getId(),
                        "from", doc.getFrom(),
                        "subject", doc.getSubject(),
                        "receivedAt", doc.getReceivedAt(),
                        "accountId", doc.getAccountId()
                )
        );
        messagingTemplate.convertAndSend("/topic/emails/" + userId, event);
        log.debug("Broadcasted NEW_EMAIL to userId={}", userId);
    }
}
