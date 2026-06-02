package com.example.docagent.service;

import com.example.docagent.dto.GenerateRequest;
import com.example.docagent.dto.GenerateResponse;
import com.example.docagent.dto.TaskStatus;
import com.example.docagent.entity.Project;
import com.example.docagent.entity.Task;
import com.example.docagent.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Python Agent 服务调用 Service
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AgentService {

    private final RestTemplate restTemplate;
    private final TaskRepository taskRepository;
    private final TaskPushService taskPushService;
    private final DocumentService documentService;

    @Value("${agent.api.base-url}")
    private String agentApiBaseUrl;

    public GenerateResponse createTask(GenerateRequest request, Project project) {
        String taskId = "task_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8);

        // 立即创建任务并入库，不等待 Agent 响应
        Task task = Task.builder()
                .id(taskId)
                .project(project)
                .status("running")
                .progress(0)
                .docType(request.getDocType())
                .build();
        taskRepository.save(task);

        // 推送初始状态
        taskPushService.pushToTopic(taskId, buildTaskStatus(task));

        // 异步处理：调用 Python Agent 并轮询进度（不阻塞当前请求）
        processTask(taskId, request);

        return GenerateResponse.builder()
                .taskId(taskId)
                .status("running")
                .message("Task created and processing started")
                .createdAt(LocalDateTime.now())
                .build();
    }

    /**
     * 异步处理：调用 Python Agent 启动任务，然后轮询进度并推送到 WebSocket
     */
    @Async
    public void processTask(String taskId, GenerateRequest request) {
        log.info("Starting async task processing for task {}", taskId);

        // 第一步：调用 Python Agent 的 /api/generate 启动生成任务
        try {
            Map<String, Object> apiRequest = new HashMap<>();
            apiRequest.put("task_id", taskId);  // 传递后端 task_id，保证前后端一致
            apiRequest.put("project_path", request.getProjectPath());
            apiRequest.put("doc_type", request.getDocType() != null ? request.getDocType() : "readme");
            apiRequest.put("language", request.getLanguage() != null ? request.getLanguage() : "chinese");
            apiRequest.put("model", request.getModel() != null ? request.getModel() : "deepseek-chat");
            if (request.getApiKey() != null) {
                apiRequest.put("api_key", request.getApiKey());
            }
            if (request.getBaseUrl() != null) {
                apiRequest.put("base_url", request.getBaseUrl());
            }
            if (request.getProjectName() != null) {
                apiRequest.put("project_name", request.getProjectName());
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(apiRequest, headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    agentApiBaseUrl + "/api/generate",
                    HttpMethod.POST,
                    entity,
                    Map.class
            );

            if (response.getStatusCode() != HttpStatus.OK || response.getBody() == null) {
                Task task = taskRepository.findById(taskId).orElse(null);
                if (task != null) {
                    task.setStatus("failed");
                    task.setError("Agent returned non-OK status: " + response.getStatusCode());
                    taskRepository.save(task);
                    taskPushService.pushToTopic(taskId, buildTaskStatus(task));
                }
                return;
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> agentResponse = response.getBody();
            String agentTaskId = (String) agentResponse.get("task_id");
            log.info("Agent task created: {}", agentTaskId);

        } catch (Exception e) {
            log.error("Failed to call Python Agent API: {}", e.getMessage());
            Task task = taskRepository.findById(taskId).orElse(null);
            if (task != null) {
                task.setStatus("failed");
                task.setError("无法连接到 AI 文档生成服务，请确认 Python Agent 已启动: " + e.getMessage());
                taskRepository.save(task);
                taskPushService.pushToTopic(taskId, buildTaskStatus(task));
            }
            return;
        }

        // 第二步：轮询 Python Agent 的任务状态
        log.info("Start polling task {} from Agent", taskId);
        int maxRetries = 300; // 最多轮询 300 次（5 分钟，每次 1 秒）
        int retryCount = 0;

        while (retryCount < maxRetries) {
            try {
                Thread.sleep(1000);

                ResponseEntity<Map> response = restTemplate.getForEntity(
                        agentApiBaseUrl + "/api/tasks/" + taskId,
                        Map.class
                );

                if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> agentTask = response.getBody();
                    Task task = taskRepository.findById(taskId).orElse(null);

                    if (task == null) {
                        log.warn("Task {} not found in DB, stopping polling", taskId);
                        break;
                    }

                    String agentStatus = (String) agentTask.get("status");
                    Integer progress = agentTask.get("progress") != null
                            ? ((Number) agentTask.get("progress")).intValue()
                            : 0;

                    task.setStatus(agentStatus != null ? agentStatus : "running");
                    task.setProgress(progress);

                    if (agentTask.get("result") != null) {
                        task.setResult(agentTask.get("result").toString());
                    }
                    if (agentTask.get("error") != null) {
                        task.setError(agentTask.get("error").toString());
                    }

                    taskRepository.save(task);
                    taskPushService.pushToTopic(taskId, buildTaskStatus(task));

                    log.info("Task {} progress: {}%, status: {}", taskId, progress, agentStatus);

                    if ("completed".equals(agentStatus) || "failed".equals(agentStatus)) {
                        log.info("Task {} finished with status: {}", taskId, agentStatus);

                        // 自动保存生成结果到项目文档
                        if ("completed".equals(agentStatus) && task != null
                                && task.getProject() != null && task.getResult() != null) {
                            try {
                                documentService.saveDocument(
                                        task.getProject().getId(),
                                        task.getDocType(),
                                        task.getResult()
                                );
                                log.info("Auto-saved document for task {} to project {}",
                                        taskId, task.getProject().getId());
                            } catch (Exception e) {
                                log.error("Failed to auto-save document for task {}", taskId, e);
                            }
                        }

                        break;
                    }
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                log.warn("Task polling interrupted for {}", taskId);
                break;
            } catch (Exception e) {
                log.error("Error polling task {} (attempt {}): {}", taskId, retryCount, e.getMessage());
            }

            retryCount++;
        }

        // 超时处理
        if (retryCount >= maxRetries) {
            Task task = taskRepository.findById(taskId).orElse(null);
            if (task != null && !"completed".equals(task.getStatus()) && !"failed".equals(task.getStatus())) {
                task.setStatus("failed");
                task.setError("Task timed out after " + maxRetries + " polling attempts");
                taskRepository.save(task);
                taskPushService.pushToTopic(taskId, buildTaskStatus(task));
            }
        }
    }

    public List<TaskStatus> getAllTasks() {
        return taskRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::buildTaskStatus)
                .collect(Collectors.toList());
    }

    private TaskStatus buildTaskStatus(Task task) {
        return TaskStatus.builder()
                .taskId(task.getId())
                .status(task.getStatus())
                .progress(task.getProgress())
                .result(task.getResult())
                .error(task.getError())
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .build();
    }

    public TaskStatus getTaskStatus(String taskId) {
        Task task = taskRepository.findById(taskId).orElse(null);

        if (task == null) {
            return null;
        }

        return TaskStatus.builder()
                .taskId(task.getId())
                .status(task.getStatus())
                .progress(task.getProgress())
                .result(task.getResult())
                .error(task.getError())
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .build();
    }

    public void updateTaskFromAgent(String taskId) {
        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(
                    agentApiBaseUrl + "/api/tasks/" + taskId,
                    Map.class
            );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> agentTask = response.getBody();
                Task task = taskRepository.findById(taskId).orElse(null);

                if (task != null) {
                    task.setStatus((String) agentTask.get("status"));
                    task.setProgress((Integer) agentTask.get("progress"));

                    Object result = agentTask.get("result");
                    if (result != null) {
                        task.setResult(result.toString());
                    }

                    Object error = agentTask.get("error");
                    if (error != null) {
                        task.setError(error.toString());
                    }

                    taskRepository.save(task);
                }
            }
        } catch (Exception e) {
            log.error("Failed to update task from agent", e);
        }
    }

    public String healthCheck() {
        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(
                    agentApiBaseUrl + "/health",
                    Map.class
            );
            if (response.getBody() != null && "healthy".equals(response.getBody().get("status"))) {
                return "healthy";
            }
            return "unhealthy";
        } catch (Exception e) {
            log.warn("Agent health check failed: {}", e.getMessage());
            return "unhealthy";
        }
    }
}