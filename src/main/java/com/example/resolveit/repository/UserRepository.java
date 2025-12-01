package com.example.resolveit.repository;

import com.example.resolveit.model.User;
import com.example.resolveit.model.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByEmail(String email);

    Optional<User> findByEmail(String email);

    List<User> findByRole(UserRole role);

    Optional<User> findByPhoneNumber(String phoneNumber);
}
