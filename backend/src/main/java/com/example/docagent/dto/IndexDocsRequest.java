package com.example.docagent.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 索引文档请求参数。
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IndexDocsRequest {
    private Long projectId;
    private Boolean force;
}
