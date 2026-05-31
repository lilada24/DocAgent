package com.example.docagent.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 项目创建请求 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectRequest {

    @NotBlank(message = "项目名称不能为空")
    private String name;

    @NotBlank(message = "项目路径不能为空")
    private String path;

    @Builder.Default
    private String language = "chinese";

    private String description;
}