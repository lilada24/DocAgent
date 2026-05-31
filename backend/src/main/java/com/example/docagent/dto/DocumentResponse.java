package com.example.docagent.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 文档响应 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentResponse {

    private Long id;

    private Long projectId;

    private String docType;

    private String content;

    private Integer version;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}