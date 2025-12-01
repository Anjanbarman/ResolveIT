package com.example.resolveit.repository;

import com.example.resolveit.model.Otp;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OtpRepository extends JpaRepository<Otp, Long> {
    Optional<Otp> findTopByPhoneNumberOrderByCreatedAtDesc(String phoneNumber);

    void deleteByPhoneNumber(String phoneNumber);
}
