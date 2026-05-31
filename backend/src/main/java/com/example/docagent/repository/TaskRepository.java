package com.example.docagent.repository;

import com.example.docagent.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 任务 Repository
 */
@Repository
public interface TaskRepository extends JpaRepository<Task, String> {

    List<Task> findByProjectId(Long projectId);

    List<Task> findByStatus(String status);

    List<Task> findByProjectIdOrderByCreatedAtDesc(Long projectId);

    List<Task> findAllByOrderByCreatedAtDesc();
}