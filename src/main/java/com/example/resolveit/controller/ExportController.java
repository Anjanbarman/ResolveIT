package com.example.resolveit.controller;

import com.example.resolveit.model.*;
import com.example.resolveit.service.ComplaintService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/export")
@RequiredArgsConstructor
public class ExportController {

    private final ComplaintService complaintService;

    @GetMapping("/complaints")
    public ResponseEntity<byte[]> exportComplaints(
            @RequestParam(value = "ids", required = false) List<Long> ids,
            Authentication authentication) {
        try {
            List<Complaint> complaints;
            // Determine which complaints to fetch based on role
            boolean isOfficer = authentication.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_OFFICER"));

            if (isOfficer) {
                complaints = complaintService.getAssignedComplaints(authentication);
            } else {
                complaints = complaintService.getAllComplaints(authentication);
            }

            // Filter by IDs if provided
            if (ids != null && !ids.isEmpty()) {
                complaints = complaints.stream()
                        .filter(c -> ids.contains(c.getId()))
                        .collect(Collectors.toList());
            }

            StringBuilder csv = new StringBuilder();
            // CSV Header - include Public Updates for non-officers
            if (isOfficer) {
                csv.append("ID,Tracking ID,Title,Category,Priority,Status,Created At,Reporter,Assigned Officer\n");
            } else {
                csv.append("ID,Tracking ID,Title,Category,Priority,Status,Created At,Reporter,Assigned Officer,Public Updates\n");
            }

            // CSV Rows
            for (Complaint c : complaints) {
                csv.append(escapeCsv(c.getId())).append(",");
                csv.append(escapeCsv(c.getTrackingId())).append(",");
                csv.append(escapeCsv(c.getTitle())).append(",");
                csv.append(escapeCsv(c.getCategory())).append(",");
                csv.append(escapeCsv(c.getPriority())).append(",");
                csv.append(escapeCsv(c.getStatus())).append(",");
                csv.append(escapeCsv(c.getCreatedAt())).append(",");
                
                String reporterName = c.getReporter() != null ? c.getReporter().getName() : c.getSubmitterName();
                csv.append(escapeCsv(reporterName)).append(",");
                
                String officerName = c.getAssignedOfficer() != null ? c.getAssignedOfficer().getName() : "Unassigned";
                csv.append(escapeCsv(officerName));
                
                // Add public updates for non-officers
                if (!isOfficer) {
                    csv.append(",");
                    List<com.example.resolveit.model.PublicUpdate> updates = c.getPublicUpdates();
                    if (updates != null && !updates.isEmpty()) {
                        String publicUpdatesText = updates.stream()
                            .map(u -> u.getAuthor().getName() + " (" + u.getCreatedAt() + "): " + u.getContent())
                            .collect(Collectors.joining(" | "));
                        csv.append(escapeCsv(publicUpdatesText));
                    }
                }
                
                csv.append("\n");
            }

            String filename = "complaints_export_" + LocalDate.now() + ".csv";
            byte[] csvBytes = csv.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.parseMediaType("text/csv"))
                    .body(csvBytes);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(400).body(null);
        }
    }

    private String escapeCsv(Object value) {
        if (value == null) return "";
        String str = value.toString();
        if (str.contains(",") || str.contains("\"") || str.contains("\n")) {
            return "\"" + str.replace("\"", "\"\"") + "\"";
        }
        return str;
    }
}
