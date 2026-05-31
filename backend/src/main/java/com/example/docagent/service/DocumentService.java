package com.example.docagent.service;

import com.example.docagent.dto.DocumentResponse;
import com.example.docagent.entity.Document;
import com.example.docagent.entity.Project;
import com.example.docagent.repository.DocumentRepository;
import com.example.docagent.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 文档管理 Service
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final ProjectRepository projectRepository;

    public DocumentResponse saveDocument(Long projectId, String docType, String content) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + projectId));

        Document document = documentRepository.findByProjectIdAndDocType(projectId, docType)
                .orElse(null);

        if (document != null) {
            document.setContent(content);
            document.setVersion(document.getVersion() + 1);
            log.info("Updated document: {} for project: {}", docType, project.getName());
        } else {
            document = Document.builder()
                    .project(project)
                    .docType(docType)
                    .content(content)
                    .version(1)
                    .build();
            log.info("Created document: {} for project: {}", docType, project.getName());
        }

        Document saved = documentRepository.save(document);
        return toResponse(saved);
    }

    public List<DocumentResponse> getDocumentsByProject(Long projectId) {
        return documentRepository.findByProjectId(projectId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public DocumentResponse getDocumentByProjectAndType(Long projectId, String docType) {
        Document document = documentRepository.findByProjectIdAndDocType(projectId, docType)
                .orElseThrow(() -> new RuntimeException(
                        "Document not found with type '" + docType + "' for project: " + projectId));
        return toResponse(document);
    }

    public List<DocumentResponse> getDocumentHistory(Long projectId, String docType) {
        return documentRepository.findByProjectIdOrderByVersionDesc(projectId).stream()
                .filter(d -> d.getDocType().equals(docType))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public void deleteDocument(Long id) {
        if (!documentRepository.existsById(id)) {
            throw new RuntimeException("Document not found with id: " + id);
        }
        documentRepository.deleteById(id);
        log.info("Deleted document with id: {}", id);
    }

    private DocumentResponse toResponse(Document document) {
        return DocumentResponse.builder()
                .id(document.getId())
                .projectId(document.getProject().getId())
                .docType(document.getDocType())
                .content(document.getContent())
                .version(document.getVersion())
                .createdAt(document.getCreatedAt())
                .updatedAt(document.getUpdatedAt())
                .build();
    }
}