package com.example.docagent.controller;

import com.example.docagent.dto.TaskStatus;
import com.example.docagent.service.AgentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.Map;

@Controller
@RequiredArgsConstructor
@Slf4j
public class WebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final AgentService agentService;

    @MessageMapping("/task/{taskId}/subscribe")
    @SendToUser("/queue/task/{taskId}")
    public TaskStatus subscribeToTask(@DestinationVariable String taskId, Principal principal) {
        log.info("User {} subscribing to task {}", principal.getName(), taskId);
        return agentService.getTaskStatus(taskId);
    }

    @MessageMapping("/task/{taskId}/status")
    public void getTaskStatus(@DestinationVariable String taskId, Principal principal) {
        log.info("Getting status for task {} by user {}", taskId, principal.getName());
        TaskStatus status = agentService.getTaskStatus(taskId);
        messagingTemplate.convertAndSendToUser(
                principal.getName(),
                "/queue/task/" + taskId,
                status
        );
    }

    @MessageMapping("/task/{taskId}/cancel")
    @SendTo("/topic/task/{taskId}")
    public Map<String, Object> cancelTask(@DestinationVariable String taskId, Principal principal) {
        log.info("User {} cancelling task {}", principal.getName(), taskId);
        return Map.of(
                "taskId", taskId,
                "status", "cancelled",
                "message", "Task cancelled by user"
        );
    }

    @MessageMapping("/ping")
    @SendToUser("/queue/pong")
    public Map<String, String> ping() {
        return Map.of("type", "pong", "timestamp", String.valueOf(System.currentTimeMillis()));
    }
}