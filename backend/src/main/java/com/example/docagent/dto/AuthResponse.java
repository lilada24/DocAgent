package com.example.docagent.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String tokenType;
    private Long userId;
    private String username;
    private String email;
    private String fullName;
    private Long expiresIn;

    public static AuthResponse of(String token, Long userId, String username, String email, String fullName, Long expiresIn) {
        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .userId(userId)
                .username(username)
                .email(email)
                .fullName(fullName)
                .expiresIn(expiresIn)
                .build();
    }
}