package com.example.resolveit.controller;

import com.example.resolveit.model.User;
import com.example.resolveit.model.UserRole;
import com.example.resolveit.service.AuthService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequest request) {
        try {
            User user = authService.signup(request.getName(), request.getEmail(), request.getPassword(), request.getRole());
            return ResponseEntity.ok(Map.of(
                    "id", user.getId(),
                    "name", user.getName(),
                    "email", user.getEmail(),
                    "role", user.getRole().toString()
            ));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(409).body(Map.of("message", ex.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            Map<String, Object> result = authService.login(request.getEmail(), request.getPassword());
            return ResponseEntity.ok(result);
        } catch (org.springframework.security.authentication.BadCredentialsException ex) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid credentials"));
        }
    }

    @Data
    static class SignupRequest {
        private String name;
        private String email;
        private String password;
        private UserRole role;
    }

    @Data
    static class LoginRequest {
        private String email;
        private String password;
    }
}
