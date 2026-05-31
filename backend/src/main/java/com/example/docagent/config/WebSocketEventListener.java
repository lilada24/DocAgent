package com.example.docagent.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketEventListener {

    private final Map<String, String> sessionUsers = new ConcurrentHashMap<>();

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        String user = headerAccessor.getFirstNativeHeader("user");

        if (user != null) {
            sessionUsers.put(sessionId, user);
            log.info("User {} connected with session {}", user, sessionId);
        } else {
            log.info("Anonymous user connected with session {}", sessionId);
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        String user = sessionUsers.remove(sessionId);

        if (user != null) {
            log.info("User {} disconnected from session {}", user, sessionId);
        } else {
            log.info("Session {} disconnected", sessionId);
        }
    }

    public int getActiveConnectionCount() {
        return sessionUsers.size();
    }
}