package com.example.docagent.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 项目响应 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectResponse {

    private Long id;

    private String name;

    private String path;

    private String language;

    private String description;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}