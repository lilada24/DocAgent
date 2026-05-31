package com.example.docagent.controller;

import com.example.docagent.dto.AuthResponse;
import com.example.docagent.dto.LoginRequest;
import com.example.docagent.dto.RegisterRequest;
import com.example.docagent.dto.UserInfo;
import com.example.docagent.entity.User;
import com.example.docagent.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    public ResponseEntity<UserInfo> getCurrentUser(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(authService.getUserInfo(user.getId()));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "登出成功");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/check")
    public ResponseEntity<Map<String, Boolean>> checkUsername(@RequestParam String username) {
        boolean exists = !username.isEmpty();
        Map<String, Boolean> response = new HashMap<>();
        response.put("available", exists);
        return ResponseEntity.ok(response);
    }
}