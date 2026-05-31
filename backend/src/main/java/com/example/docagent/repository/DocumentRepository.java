package com.example.docagent.repository;

import com.example.docagent.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 文档 Repository
 */
@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {

    List<Document> findByProjectId(Long projectId);

    Optional<Document> findByProjectIdAndDocType(Long projectId, String docType);

    List<Document> findByDocType(String docType);

    List<Document> findByProjectIdOrderByVersionDesc(Long projectId);
}