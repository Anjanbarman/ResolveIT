package com.example.resolveit.service;

import com.example.resolveit.model.Otp;
import com.example.resolveit.model.User;
import com.example.resolveit.repository.OtpRepository;
import com.example.resolveit.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpService {

    private final OtpRepository otpRepository;
    private final UserRepository userRepository;

    @Value("${twofactor.api.key:}")
    private String twoFactorApiKey;

    private static final Pattern INDIAN_PHONE_PATTERN = Pattern.compile("^[6-9]\\d{9}$");

    private static final int OTP_VALIDITY_MINUTES = 5;

    private final SecureRandom secureRandom = new SecureRandom();
    private final RestTemplate restTemplate = new RestTemplate();

    public boolean isValidIndianPhoneNumber(String phoneNumber) {
        if (phoneNumber == null) {
            return false;
        }

        String cleanedNumber = phoneNumber.replaceAll("^(\\+91|91)", "").trim();
        return INDIAN_PHONE_PATTERN.matcher(cleanedNumber).matches();
    }

    public String normalizePhoneNumber(String phoneNumber) {
        if (phoneNumber == null) {
            return null;
        }
        return phoneNumber.replaceAll("^(\\+91|91)", "").trim();
    }

    private String generateOtpCode() {
        int otp = 100000 + secureRandom.nextInt(900000); // Generates 6-digit number
        return String.valueOf(otp);
    }

    @Transactional
    public String sendOtp(String phoneNumber) {
        String normalizedPhone = normalizePhoneNumber(phoneNumber);

        if (!isValidIndianPhoneNumber(normalizedPhone)) {
            throw new IllegalArgumentException(
                    "Invalid Indian phone number. Must be a 10-digit number starting with 6-9.");
        }

        if (userRepository.findByPhoneNumber(normalizedPhone).isPresent()) {
            User existingUser = userRepository.findByPhoneNumber(normalizedPhone).get();
            if (existingUser.getPhoneVerified()) {
                throw new IllegalArgumentException("This phone number is already verified by another user.");
            }
        }

        String otpCode = generateOtpCode();

        Otp otp = Otp.builder()
                .phoneNumber(normalizedPhone)
                .otpCode(otpCode)
                .expiresAt(LocalDateTime.now().plusMinutes(OTP_VALIDITY_MINUTES))
                .verified(false)
                .build();

        otpRepository.save(otp);

        sendSms(normalizedPhone, otpCode);

        return "OTP sent successfully to +91" + normalizedPhone;
    }

    private void sendSms(String phoneNumber, String otpCode) {
        if (twoFactorApiKey != null && !twoFactorApiKey.isEmpty()) {
            try {
                String url = String.format(
                        "https://2factor.in/API/V1/%s/SMS/%s/%s/AUTOGEN",
                        twoFactorApiKey, phoneNumber, otpCode);

                ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);

                log.info("2Factor.in Response: {}", response.getBody());

                if (response.getStatusCode().is2xxSuccessful() &&
                        response.getBody() != null &&
                        response.getBody().contains("Success")) {
                    log.info("OTP sent successfully via 2Factor.in to +91{}", phoneNumber);
                    return;
                } else {
                    log.warn("2Factor.in failed. Response: {}", response.getBody());
                }
            } catch (Exception e) {
                log.error("Failed to send SMS via 2Factor.in: {}", e.getMessage());
            }
        }

        log.info("===============================================");
        log.info("  OTP for +91{}: {}", phoneNumber, otpCode);
        log.info("  Valid for {} minutes", OTP_VALIDITY_MINUTES);
        log.info("===============================================");
    }

    @Transactional
    public boolean verifyOtp(String phoneNumber, String otpCode) {
        String normalizedPhone = normalizePhoneNumber(phoneNumber);

        if (!isValidIndianPhoneNumber(normalizedPhone)) {
            throw new IllegalArgumentException("Invalid Indian phone number.");
        }

        Otp otp = otpRepository.findTopByPhoneNumberOrderByCreatedAtDesc(normalizedPhone)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No OTP found for this phone number. Please request a new OTP."));

        if (otp.isExpired()) {
            throw new IllegalArgumentException("OTP has expired. Please request a new OTP.");
        }

        if (otp.getVerified()) {
            throw new IllegalArgumentException("OTP already used. Please request a new OTP.");
        }

        if (!otp.getOtpCode().equals(otpCode)) {
            throw new IllegalArgumentException("Invalid OTP. Please try again.");
        }

        otp.setVerified(true);
        otpRepository.save(otp);

        return true;
    }

    @Transactional
    public User verifyOtpAndLinkToUser(String phoneNumber, String otpCode, String userEmail) {
        String normalizedPhone = normalizePhoneNumber(phoneNumber);

        verifyOtp(normalizedPhone, otpCode);

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));

        user.setPhoneNumber(normalizedPhone);
        user.setPhoneVerified(true);

        return userRepository.save(user);
    }
}
