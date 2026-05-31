package com.example.docagent.service;

import com.example.docagent.dto.TaskStatus;
import com.example.docagent.entity.Task;
import com.example.docagent.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskPushService {

    private final SimpMessagingTemplate messagingTemplate;
    private final TaskRepository taskRepository;

    @Async
    public void pushTaskUpdate(String taskId, String userId) {
        Task task = taskRepository.findById(taskId).orElse(null);
        if (task == null) {
            return;
        }

        TaskStatus status = TaskStatus.builder()
                .taskId(task.getId())
                .status(task.getStatus())
                .progress(task.getProgress())
                .result(task.getResult())
                .error(task.getError())
                .createdAt(task.getCreatedAt())
                .updatedAt(LocalDateTime.now())
                .build();

        messagingTemplate.convertAndSendToUser(
                userId,
                "/queue/task/" + taskId,
                status
        );

        log.debug("Pushed task update for task {} to user {}", taskId, userId);
    }

    @Scheduled(fixedDelay = 2000)
    public void checkRunningTasks() {
        List<Task> runningTasks = taskRepository.findByStatus("running");
        for (Task task : runningTasks) {
            try {
                messagingTemplate.convertAndSend(
                        "/topic/task/" + task.getId(),
                        TaskStatus.builder()
                                .taskId(task.getId())
                                .status(task.getStatus())
                                .progress(task.getProgress())
                                .result(task.getResult())
                                .error(task.getError())
                                .createdAt(task.getCreatedAt())
                                .updatedAt(LocalDateTime.now())
                                .build()
                );
            } catch (Exception e) {
                log.error("Failed to push task update", e);
            }
        }
    }

    public void pushTaskCreated(String taskId, String userId) {
        messagingTemplate.convertAndSendToUser(
                userId,
                "/queue/task/created",
                TaskStatus.builder()
                        .taskId(taskId)
                        .status("created")
                        .progress(0)
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build()
        );
    }

    public void pushTaskCompleted(String taskId, String userId, String result) {
        messagingTemplate.convertAndSendToUser(
                userId,
                "/queue/task/" + taskId,
                TaskStatus.builder()
                        .taskId(taskId)
                        .status("completed")
                        .progress(100)
                        .result(result)
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build()
        );
    }

    public void pushTaskFailed(String taskId, String userId, String error) {
        messagingTemplate.convertAndSendToUser(
                userId,
                "/queue/task/" + taskId,
                TaskStatus.builder()
                        .taskId(taskId)
                        .status("failed")
                        .error(error)
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build()
        );
    }
}