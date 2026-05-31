package com.example.docagent.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 任务状态 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskStatus {

    private String taskId;

    private String status;

    private Integer progress;

    private String result;

    private String error;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}