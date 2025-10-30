package com.example.resolveit.controller;

import com.example.resolveit.model.*;
import com.example.resolveit.service.ComplaintService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/complaints")
@RequiredArgsConstructor
public class ComplaintController {

    private final ComplaintService complaintService;

    @PostMapping
    public ResponseEntity<?> createComplaint(
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam("category") ComplaintCategory category,
            @RequestParam(value = "priority", required = false) ComplaintPriority priority,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "submitterName", required = false) String submitterName,
            @RequestParam(value = "submitterContact", required = false) String submitterContact,
            Authentication authentication) {
        try {
            Complaint complaint = complaintService.createComplaint(
                    title, description, category, priority, file,
                    submitterName, submitterContact, authentication
            );
            return ResponseEntity.ok(toDto(complaint));
        } catch (IOException e) {
            return ResponseEntity.status(500).body(Map.of("message", "File upload failed"));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllComplaints(Authentication authentication) {
        try {
            List<Complaint> complaints = complaintService.getAllComplaints(authentication);
            List<Map<String, Object>> dtos = complaints.stream()
                    .map(this::toDto)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getComplaintById(@PathVariable Long id, Authentication authentication) {
        try {
            Complaint complaint = complaintService.getComplaintById(id, authentication);
            return ResponseEntity.ok(toDto(complaint));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateComplaint(
            @PathVariable Long id,
            @RequestBody UpdateComplaintRequest request,
            Authentication authentication) {
        try {
            Complaint complaint = complaintService.updateComplaint(
                    id, request.getTitle(), request.getDescription(),
                    request.getCategory(), request.getPriority(), authentication
            );
            return ResponseEntity.ok(toDto(complaint));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/withdraw")
    public ResponseEntity<?> withdrawComplaint(@PathVariable Long id, Authentication authentication) {
        try {
            complaintService.withdrawComplaint(id, authentication);
            return ResponseEntity.ok(Map.of("message", "Complaint withdrawn successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long id,
            @RequestBody UpdateStatusRequest request,
            Authentication authentication) {
        try {
            Complaint complaint = complaintService.updateStatus(
                    id, request.getStatus(), request.getAdminNotes(), authentication
            );
            return ResponseEntity.ok(toDto(complaint));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        }
    }

    private Map<String, Object> toDto(Complaint complaint) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", complaint.getId());
        dto.put("title", complaint.getTitle());
        dto.put("description", complaint.getDescription());
        dto.put("category", complaint.getCategory().toString());
        dto.put("priority", complaint.getPriority().toString());
        dto.put("status", complaint.getStatus().toString());
        dto.put("attachmentPath", complaint.getAttachmentPath());
        dto.put("createdAt", complaint.getCreatedAt().toString());
        dto.put("updatedAt", complaint.getUpdatedAt().toString());
        dto.put("resolvedAt", complaint.getResolvedAt() != null ? complaint.getResolvedAt().toString() : null);
        dto.put("adminNotes", complaint.getAdminNotes());

        if (complaint.getReporter() != null) {
            dto.put("reporter", Map.of(
                    "id", complaint.getReporter().getId(),
                    "name", complaint.getReporter().getName(),
                    "email", complaint.getReporter().getEmail()
            ));
        } else {
            dto.put("submitterName", complaint.getSubmitterName());
            dto.put("submitterContact", complaint.getSubmitterContact());
        }

        return dto;
    }

    @Data
    static class UpdateComplaintRequest {
        private String title;
        private String description;
        private ComplaintCategory category;
        private ComplaintPriority priority;
    }

    @Data
    static class UpdateStatusRequest {
        private ComplaintStatus status;
        private String adminNotes;
    }
}
