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
import java.time.LocalDate;
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
                    submitterName, submitterContact, authentication);
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
                    request.getCategory(), request.getPriority(), authentication);
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
                    id, request.getStatus(), request.getAdminNotes(), authentication);
            return ResponseEntity.ok(toDto(complaint));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/assign")
    public ResponseEntity<?> assignOfficer(
            @PathVariable Long id,
            @RequestBody AssignOfficerRequest request,
            Authentication authentication) {
        try {
            Complaint complaint = complaintService.assignOfficer(id, request.getOfficerId(),
                    request.getTargetResolutionDate(), authentication);
            return ResponseEntity.ok(toDto(complaint));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/unassign")
    public ResponseEntity<?> unassignOfficer(
            @PathVariable Long id,
            Authentication authentication) {
        try {
            Complaint complaint = complaintService.unassignOfficer(id, authentication);
            return ResponseEntity.ok(toDto(complaint));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/officers")
    public ResponseEntity<?> getOfficers() {
        try {
            List<User> officers = complaintService.getOfficers();
            List<Map<String, Object>> officerDtos = officers.stream()
                    .map(officer -> {
                        Map<String, Object> dto = new HashMap<>();
                        dto.put("id", officer.getId());
                        dto.put("name", officer.getName());
                        dto.put("email", officer.getEmail());
                        return dto;
                    })
                    .collect(Collectors.toList());
            return ResponseEntity.ok(officerDtos);
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/internal-notes")
    public ResponseEntity<?> addInternalNote(
            @PathVariable Long id,
            @RequestBody NoteRequest request,
            Authentication authentication) {
        try {
            complaintService.addInternalNote(id, request.getContent(), authentication);
            return ResponseEntity.ok(Map.of("message", "Internal note added successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{id}/internal-notes")
    public ResponseEntity<?> getInternalNotes(@PathVariable Long id, Authentication authentication) {
        try {
            List<com.example.resolveit.model.InternalNote> notes = complaintService.getInternalNotes(id,
                    authentication);
            List<Map<String, Object>> noteDtos = notes.stream()
                    .map(note -> {
                        Map<String, Object> dto = new HashMap<>();
                        dto.put("id", note.getId());
                        dto.put("content", note.getContent());
                        dto.put("authorName", note.getAuthor().getName());
                        dto.put("authorRole", note.getAuthor().getRole().toString());
                        dto.put("createdAt", note.getCreatedAt().toString());
                        return dto;
                    })
                    .collect(Collectors.toList());
            return ResponseEntity.ok(noteDtos);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/public-updates")
    public ResponseEntity<?> addPublicUpdate(
            @PathVariable Long id,
            @RequestBody NoteRequest request,
            Authentication authentication) {
        try {
            complaintService.addPublicUpdate(id, request.getContent(), authentication);
            return ResponseEntity.ok(Map.of("message", "Public update added successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{id}/public-updates")
    public ResponseEntity<?> getPublicUpdates(@PathVariable Long id, Authentication authentication) {
        try {
            List<com.example.resolveit.model.PublicUpdate> updates = complaintService.getPublicUpdates(id,
                    authentication);
            List<Map<String, Object>> updateDtos = updates.stream()
                    .map(update -> {
                        Map<String, Object> dto = new HashMap<>();
                        dto.put("id", update.getId());
                        dto.put("content", update.getContent());
                        dto.put("authorName", update.getAuthor().getName());
                        dto.put("createdAt", update.getCreatedAt().toString());
                        return dto;
                    })
                    .collect(Collectors.toList());
            return ResponseEntity.ok(updateDtos);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/assigned")
    public ResponseEntity<?> getAssignedComplaints(Authentication authentication) {
        try {
            List<Complaint> complaints = complaintService.getAssignedComplaints(authentication);
            List<Map<String, Object>> dtos = complaints.stream()
                    .map(this::toDto)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
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
        dto.put("trackingId", complaint.getTrackingId());
        dto.put("targetResolutionDate",
                complaint.getTargetResolutionDate() != null ? complaint.getTargetResolutionDate().toString() : null);
        dto.put("reopenedAt", complaint.getReopenedAt() != null ? complaint.getReopenedAt().toString() : null);

        if (complaint.getReporter() != null) {
            Map<String, Object> reporterDto = new HashMap<>();
            reporterDto.put("id", complaint.getReporter().getId());
            reporterDto.put("name", complaint.getReporter().getName());
            reporterDto.put("email", complaint.getReporter().getEmail());
            dto.put("reporter", reporterDto);
        } else {
            dto.put("submitterName", complaint.getSubmitterName());
            dto.put("submitterContact", complaint.getSubmitterContact());
        }

        if (complaint.getAssignedOfficer() != null) {
            Map<String, Object> officerDto = new HashMap<>();
            officerDto.put("id", complaint.getAssignedOfficer().getId());
            officerDto.put("name", complaint.getAssignedOfficer().getName());
            officerDto.put("email", complaint.getAssignedOfficer().getEmail());
            dto.put("assignedOfficer", officerDto);
        }

        return dto;
    }

    @PostMapping("/{id}/reopen")
    public ResponseEntity<?> reopenComplaint(@PathVariable Long id, Authentication authentication) {
        try {
            Complaint c = complaintService.reopenComplaint(id, authentication);
            return ResponseEntity.ok(toDto(c));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchComplaints(
            @RequestParam(value = "trackingId", required = false) String trackingId,
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "category", required = false) ComplaintCategory category,
            @RequestParam(value = "priority", required = false) ComplaintPriority priority,
            @RequestParam(value = "status", required = false) ComplaintStatus status,
            @RequestParam(value = "from", required = false) String from,
            @RequestParam(value = "to", required = false) String to,
            Authentication authentication) {
        try {
            LocalDate fromDate = from != null ? LocalDate.parse(from) : null;
            LocalDate toDate = to != null ? LocalDate.parse(to) : null;
            List<Complaint> results = complaintService.searchComplaints(trackingId, keyword, category, priority, status,
                    fromDate, toDate, authentication);
            List<Map<String, Object>> dtos = results.stream().map(this::toDto).toList();
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/metrics/admin")
    public ResponseEntity<?> getAdminMetrics(Authentication authentication) {
        try {
            ComplaintService.DashboardMetrics m = complaintService.getAdminMetrics(authentication);
            return ResponseEntity.ok(Map.of(
                    "total", m.getTotal(),
                    "resolved", m.getResolvedOrCompleted(),
                    "pending", m.getPending(),
                    "inProgress", m.getInProgress(),
                    "unresolved", m.getUnresolved(),
                    "averageResolutionHours", m.getAverageResolutionHours()));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/metrics/officer")
    public ResponseEntity<?> getOfficerMetrics(Authentication authentication) {
        try {
            ComplaintService.DashboardMetrics m = complaintService.getOfficerMetrics(authentication);
            return ResponseEntity.ok(Map.of(
                    "totalAssigned", m.getTotal(),
                    "completed", m.getResolvedOrCompleted(),
                    "pending", m.getPending(),
                    "inProgress", m.getInProgress(),
                    "averageResolutionHours", m.getAverageResolutionHours()));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        }
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

    @Data
    static class AssignOfficerRequest {
        private Long officerId;
        private LocalDate targetResolutionDate;
    }

    @Data
    static class NoteRequest {
        private String content;
    }
}
