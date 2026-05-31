package com.example.docagent.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 文档生成请求 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GenerateRequest {

    @NotBlank(message = "项目路径不能为空")
    private String projectPath;

    @Builder.Default
    private String docType = "readme";

    @Builder.Default
    private String language = "chinese";

    @Builder.Default
    private String model = "deepseek-chat";

    private String apiKey;

    private String baseUrl;

    private String projectName;
}