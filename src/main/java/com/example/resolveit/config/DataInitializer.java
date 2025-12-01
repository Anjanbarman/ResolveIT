package com.example.resolveit.config;

import com.example.resolveit.model.User;
import com.example.resolveit.model.UserRole;
import com.example.resolveit.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            log.info("No users found. Creating default admin user.");
            User admin = User.builder()
                    .name("Admin User")
                    .email("admin@resolveit.com")
                    .password(passwordEncoder.encode("admin123"))
                    .role(UserRole.ADMIN)
                    .build();
            userRepository.save(admin);
            log.info("Default admin user created: admin@resolveit.com / admin123");
        } else {
            log.info("Users found. Checking for plain text passwords...");
            userRepository.findAll().forEach(user -> {
                // BCrypt hashes typically start with $2a$, $2b$, or $2y$
                if (!user.getPassword().startsWith("$2")) {
                    log.warn("User {} appears to have a plain text password. Updating to BCrypt hash.",
                            user.getEmail());
                    user.setPassword(passwordEncoder.encode(user.getPassword()));
                    userRepository.save(user);
                    log.info("Password updated for user {}", user.getEmail());
                }
            });
        }
    }
}
