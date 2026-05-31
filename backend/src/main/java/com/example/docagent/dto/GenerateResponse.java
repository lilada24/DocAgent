package com.example.docagent.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 文档生成响应 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GenerateResponse {

    private String taskId;

    private String status;

    private String message;

    private LocalDateTime createdAt;
}