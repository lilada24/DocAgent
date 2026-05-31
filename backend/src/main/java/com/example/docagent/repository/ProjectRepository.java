package com.example.docagent.repository;

import com.example.docagent.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    List<Project> findByNameContaining(String name);

    List<Project> findByLanguage(String language);

    List<Project> findByUserId(Long userId);

    List<Project> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<Project> findByIdAndUserId(Long id, Long userId);

    boolean existsByName(String name);

    boolean existsByPath(String path);

    boolean existsByNameAndUserId(String name, Long userId);

    @Query("SELECT p FROM Project p WHERE p.user.id = :userId AND p.name LIKE %:keyword%")
    List<Project> searchByUserIdAndKeyword(@Param("userId") Long userId, @Param("keyword") String keyword);
}