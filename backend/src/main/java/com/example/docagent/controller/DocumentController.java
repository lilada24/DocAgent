package com.example.docagent.controller;

import com.example.docagent.dto.GenerateRequest;
import com.example.docagent.dto.GenerateResponse;
import com.example.docagent.dto.TaskStatus;
import com.example.docagent.entity.Project;
import com.example.docagent.service.AgentService;
import com.example.docagent.service.DocumentService;
import com.example.docagent.service.ProjectService;
import com.example.docagent.repository.ProjectRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 文档生成 Controller
 */
@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class DocumentController {

    private final AgentService agentService;
    private final ProjectService projectService;
    private final DocumentService documentService;
    private final ProjectRepository projectRepository;

    @PostMapping("/generate")
    public ResponseEntity<GenerateResponse> generateDocument(@Valid @RequestBody GenerateRequest request) {
        log.info("Received generate request: docType={}, projectPath={}", request.getDocType(), request.getProjectPath());

        Project project = null;
        if (request.getProjectName() != null) {
            try {
                project = projectRepository.findById(Long.parseLong(request.getProjectName())).orElse(null);
            } catch (NumberFormatException e) {
                project = null;
            }
        }

        GenerateResponse response = agentService.createTask(request, project);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/tasks/{taskId}")
    public ResponseEntity<TaskStatus> getTaskStatus(@PathVariable String taskId) {
        agentService.updateTaskFromAgent(taskId);
        TaskStatus status = agentService.getTaskStatus(taskId);

        if (status == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(status);
    }

    @GetMapping("/tasks")
    public ResponseEntity<List<TaskStatus>> getAllTasks() {
        return ResponseEntity.ok(List.of());
    }

    @PostMapping("/projects/{projectId}/documents")
    public ResponseEntity<Map<String, Object>> saveDocument(
            @PathVariable Long projectId,
            @RequestBody Map<String, String> request) {
        String docType = request.get("docType");
        String content = request.get("content");

        var doc = documentService.saveDocument(projectId, docType, content);

        Map<String, Object> response = new HashMap<>();
        response.put("id", doc.getId());
        response.put("docType", doc.getDocType());
        response.put("version", doc.getVersion());
        response.put("updatedAt", doc.getUpdatedAt());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/projects/{projectId}/documents")
    public ResponseEntity<List<Map<String, Object>>> getProjectDocuments(@PathVariable Long projectId) {
        var docs = documentService.getDocumentsByProject(projectId);

        List<Map<String, Object>> response = docs.stream()
                .map(doc -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", doc.getId());
                    map.put("docType", doc.getDocType());
                    map.put("version", doc.getVersion());
                    map.put("updatedAt", doc.getUpdatedAt());
                    map.put("preview", doc.getContent() != null && doc.getContent().length() > 100
                            ? doc.getContent().substring(0, 100) + "..."
                            : doc.getContent());
                    return map;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/projects/{projectId}/documents/{docType}")
    public ResponseEntity<Map<String, Object>> getDocument(
            @PathVariable Long projectId,
            @PathVariable String docType) {
        var doc = documentService.getDocumentByProjectAndType(projectId, docType);

        Map<String, Object> response = new HashMap<>();
        response.put("id", doc.getId());
        response.put("docType", doc.getDocType());
        response.put("content", doc.getContent());
        response.put("version", doc.getVersion());
        response.put("createdAt", doc.getCreatedAt());
        response.put("updatedAt", doc.getUpdatedAt());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        Map<String, String> status = new HashMap<>();
        status.put("backend", "healthy");
        status.put("agent", agentService.healthCheck());
        return ResponseEntity.ok(status);
    }
}