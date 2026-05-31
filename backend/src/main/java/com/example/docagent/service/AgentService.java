package com.example.docagent.service;

import com.example.docagent.dto.GenerateRequest;
import com.example.docagent.dto.GenerateResponse;
import com.example.docagent.dto.TaskStatus;
import com.example.docagent.entity.Project;
import com.example.docagent.entity.Task;
import com.example.docagent.repository.TaskRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Python Agent 服务调用 Service
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AgentService {

    private final RestTemplate restTemplate;
    private final TaskRepository taskRepository;
    private final ObjectMapper objectMapper;

    @Value("${agent.api.base-url}")
    private String agentApiBaseUrl;

    @Value("${agent.api.timeout}")
    private int agentApiTimeout;

    public GenerateResponse createTask(GenerateRequest request, Project project) {
        String taskId = "task_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8);

        Task task = Task.builder()
                .id(taskId)
                .project(project)
                .status("pending")
                .progress(0)
                .docType(request.getDocType())
                .build();
        taskRepository.save(task);

        try {
            Map<String, Object> apiRequest = new HashMap<>();
            apiRequest.put("project_path", request.getProjectPath());
            apiRequest.put("doc_type", request.getDocType());
            apiRequest.put("language", request.getLanguage());
            apiRequest.put("model", request.getModel());
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

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                task.setStatus("created");
                taskRepository.save(task);

                return GenerateResponse.builder()
                        .taskId(taskId)
                        .status("created")
                        .message("Task created and queued for processing")
                        .createdAt(LocalDateTime.now())
                        .build();
            }

        } catch (Exception e) {
            log.error("Failed to call Python Agent API", e);
            task.setStatus("failed");
            task.setError(e.getMessage());
            taskRepository.save(task);
        }

        return GenerateResponse.builder()
                .taskId(taskId)
                .status("error")
                .message("Failed to create task")
                .createdAt(LocalDateTime.now())
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