package com.example.resolveit.controller;

import com.example.resolveit.model.User;
import com.example.resolveit.service.OtpService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/otp")
@RequiredArgsConstructor
public class OtpController {

    private final OtpService otpService;

    /**
     * Send OTP to an Indian phone number
     */
    @PostMapping("/send")
    public ResponseEntity<?> sendOtp(@RequestBody SendOtpRequest request) {
        try {
            String message = otpService.sendOtp(request.getPhoneNumber());
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", message));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()));
        }
    }

    /**
     * Verify OTP (standalone verification)
     */
    @PostMapping("/verify")
    public ResponseEntity<?> verifyOtp(@RequestBody VerifyOtpRequest request) {
        try {
            boolean verified = otpService.verifyOtp(request.getPhoneNumber(), request.getOtpCode());
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "verified", verified,
                    "message", "Phone number verified successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "verified", false,
                    "message", e.getMessage()));
        }
    }

    /**
     * Verify OTP and link phone number to authenticated user
     */
    @PostMapping("/verify-and-link")
    public ResponseEntity<?> verifyAndLink(@RequestBody VerifyOtpRequest request, Authentication authentication) {
        try {
            if (authentication == null) {
                return ResponseEntity.status(401).body(Map.of(
                        "success", false,
                        "message", "You must be logged in to link a phone number"));
            }

            String userEmail = authentication.getName();
            User user = otpService.verifyOtpAndLinkToUser(request.getPhoneNumber(), request.getOtpCode(), userEmail);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Phone number verified and linked to your account",
                    "phoneNumber", "+91" + user.getPhoneNumber(),
                    "phoneVerified", user.getPhoneVerified()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()));
        }
    }

    /**
     * Validate if a phone number is a valid Indian number
     */
    @PostMapping("/validate")
    public ResponseEntity<?> validatePhoneNumber(@RequestBody SendOtpRequest request) {
        boolean isValid = otpService.isValidIndianPhoneNumber(request.getPhoneNumber());
        String normalized = otpService.normalizePhoneNumber(request.getPhoneNumber());

        return ResponseEntity.ok(Map.of(
                "valid", isValid,
                "normalizedNumber", normalized != null ? normalized : "",
                "formattedNumber", isValid ? "+91" + normalized : ""));
    }

    @Data
    static class SendOtpRequest {
        private String phoneNumber;
    }

    @Data
    static class VerifyOtpRequest {
        private String phoneNumber;
        private String otpCode;
    }
}
