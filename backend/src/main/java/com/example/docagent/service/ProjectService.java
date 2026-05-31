package com.example.docagent.service;

import com.example.docagent.dto.ProjectRequest;
import com.example.docagent.dto.ProjectResponse;
import com.example.docagent.entity.Project;
import com.example.docagent.entity.User;
import com.example.docagent.repository.ProjectRepository;
import com.example.docagent.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    public ProjectResponse createProject(ProjectRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (projectRepository.existsByNameAndUserId(request.getName(), userId)) {
            throw new RuntimeException("项目名称已存在");
        }

        Project project = Project.builder()
                .name(request.getName())
                .path(request.getPath())
                .language(request.getLanguage())
                .description(request.getDescription())
                .user(user)
                .build();

        Project saved = projectRepository.save(project);
        log.info("User {} created project: {}", userId, saved.getName());

        return toResponse(saved);
    }

    public List<ProjectResponse> getAllProjectsByUser(Long userId) {
        return projectRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public ProjectResponse getProjectById(Long id, Long userId) {
        Project project = projectRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("项目不存在"));
        return toResponse(project);
    }

    public ProjectResponse updateProject(Long id, ProjectRequest request, Long userId) {
        Project project = projectRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("项目不存在"));

        project.setName(request.getName());
        project.setPath(request.getPath());
        project.setLanguage(request.getLanguage());
        project.setDescription(request.getDescription());

        Project saved = projectRepository.save(project);
        log.info("User {} updated project: {}", userId, saved.getName());

        return toResponse(saved);
    }

    public void deleteProject(Long id, Long userId) {
        Project project = projectRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("项目不存在"));
        projectRepository.delete(project);
        log.info("User {} deleted project with id: {}", userId, id);
    }

    public List<ProjectResponse> searchProjects(String keyword, Long userId) {
        return projectRepository.searchByUserIdAndKeyword(userId, keyword).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private ProjectResponse toResponse(Project project) {
        return ProjectResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .path(project.getPath())
                .language(project.getLanguage())
                .description(project.getDescription())
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .build();
    }
}