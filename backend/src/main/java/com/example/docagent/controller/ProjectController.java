package com.example.docagent.controller;

import com.example.docagent.dto.ProjectRequest;
import com.example.docagent.dto.ProjectResponse;
import com.example.docagent.entity.User;
import com.example.docagent.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class ProjectController {

    private final ProjectService projectService;

    @PostMapping
    public ResponseEntity<ProjectResponse> createProject(
            @Valid @RequestBody ProjectRequest request,
            @AuthenticationPrincipal User user) {
        log.info("User {} creating project: {}", user.getId(), request.getName());
        ProjectResponse response = projectService.createProject(request, user.getId());
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<ProjectResponse>> getAllProjects(@AuthenticationPrincipal User user) {
        List<ProjectResponse> projects = projectService.getAllProjectsByUser(user.getId());
        return ResponseEntity.ok(projects);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectResponse> getProjectById(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        ProjectResponse response = projectService.getProjectById(id, user.getId());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProjectResponse> updateProject(
            @PathVariable Long id,
            @Valid @RequestBody ProjectRequest request,
            @AuthenticationPrincipal User user) {
        log.info("User {} updating project: {}", user.getId(), id);
        ProjectResponse response = projectService.updateProject(id, request, user.getId());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        log.info("User {} deleting project: {}", user.getId(), id);
        projectService.deleteProject(id, user.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    public ResponseEntity<List<ProjectResponse>> searchProjects(
            @RequestParam String keyword,
            @AuthenticationPrincipal User user) {
        List<ProjectResponse> projects = projectService.searchProjects(keyword, user.getId());
        return ResponseEntity.ok(projects);
    }
}