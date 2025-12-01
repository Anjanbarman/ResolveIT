package com.example.resolveit.service;

import com.example.resolveit.model.User;
import com.example.resolveit.model.UserRole;
import com.example.resolveit.repository.UserRepository;
import com.example.resolveit.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;

    @SuppressWarnings("null")
    public User signup(String name, String email, String rawPassword, UserRole role, String phoneNumber) {
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already in use");
        }

        // Check if phone number is already in use (if provided)
        if (phoneNumber != null && !phoneNumber.isEmpty()) {
            if (userRepository.findByPhoneNumber(phoneNumber).isPresent()) {
                throw new IllegalArgumentException("Phone number already in use");
            }
        }

        User user = User.builder()
                .name(name)
                .email(email)
                .password(passwordEncoder.encode(rawPassword))
                .role(role != null ? role : UserRole.CITIZEN)
                .phoneNumber(phoneNumber)
                .phoneVerified(phoneNumber != null && !phoneNumber.isEmpty())
                .build();
        return userRepository.save(user);
    }

    public Map<String, Object> login(String email, String password) {
        // Check if user exists first
        if (!userRepository.existsByEmail(email)) {
            throw new BadCredentialsException("User not found with email: " + email);
        }
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, password));
        } catch (Exception e) {
            throw new BadCredentialsException("Invalid password");
        }
        String token = jwtTokenProvider.generateToken(email);
        User user = userRepository.findByEmail(email).orElseThrow();
        return Map.of(
                "token", token,
                "user", Map.of(
                        "id", user.getId(),
                        "name", user.getName(),
                        "email", user.getEmail(),
                        "role", user.getRole().toString()));
    }
}
