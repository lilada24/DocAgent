package com.example.docagent.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserInfo {
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String phone;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}