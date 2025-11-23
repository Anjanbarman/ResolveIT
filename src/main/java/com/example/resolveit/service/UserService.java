package com.example.resolveit.service;

import com.example.resolveit.model.User;
import com.example.resolveit.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    @Transactional
    public User updateUserProfile(String currentEmail, String newName, String newEmail) {
        User user = getUserByEmail(currentEmail);
        
        // Update name if provided
        if (newName != null && !newName.trim().isEmpty()) {
            user.setName(newName.trim());
        }
        
        // Update email if provided and different
        if (newEmail != null && !newEmail.trim().isEmpty() && !newEmail.equals(currentEmail)) {
            // Check if new email is already taken by another user
            if (userRepository.existsByEmail(newEmail)) {
                throw new IllegalArgumentException("Email already in use by another user");
            }
            user.setEmail(newEmail.trim());
        }
        
        return userRepository.save(user);
    }

    @Transactional
    public void changePassword(String email, String oldPassword, String newPassword) {
        User user = getUserByEmail(email);
        
        // Verify old password
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new BadCredentialsException("Current password is incorrect");
        }
        
        // Validate new password
        if (newPassword == null || newPassword.length() < 6) {
            throw new IllegalArgumentException("New password must be at least 6 characters long");
        }
        
        // Update password
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}
