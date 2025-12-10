package com.example.resolveit.service;

import com.example.resolveit.dto.ComplaintTrackingResponse;
import com.example.resolveit.model.Complaint;
import com.example.resolveit.model.ComplaintStatus;
import com.example.resolveit.repository.ComplaintRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnonymousComplaintService {

    private final ComplaintRepository complaintRepository;

    /**
     * Track complaint by tracking ID - no authentication required
     */
    public ComplaintTrackingResponse trackComplaint(String trackingId) {
        String normalizedTrackingId = trackingId.toUpperCase().trim();

        Complaint complaint = complaintRepository.findOptionalByTrackingId(normalizedTrackingId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No complaint found with tracking ID: " + trackingId + ". Please check the ID and try again."));

        log.info("Tracking complaint with ID: {}", normalizedTrackingId);

        return buildTrackingResponse(complaint);
    }

    private ComplaintTrackingResponse buildTrackingResponse(Complaint complaint) {
        List<ComplaintTrackingResponse.StatusTimeline> timeline = buildTimeline(complaint);
        List<ComplaintTrackingResponse.PublicUpdateDto> publicUpdates = buildPublicUpdates(complaint);

        return ComplaintTrackingResponse.builder()
                .trackingId(complaint.getTrackingId())
                .title(complaint.getTitle())
                .category(complaint.getCategory().name())
                .status(complaint.getStatus().name())
                .statusDescription(getStatusDescription(complaint.getStatus()))
                .priority(complaint.getPriority().name())
                .targetResolutionDate(complaint.getTargetResolutionDate())
                .assignedDepartment(
                        complaint.getAssignedOfficer() != null ? "Assigned to Officer" : "Pending Assignment")
                .submittedAt(complaint.getCreatedAt())
                .lastUpdatedAt(complaint.getUpdatedAt())
                .resolvedAt(complaint.getResolvedAt())
                .resolutionNotes(complaint.getStatus() == ComplaintStatus.RESOLVED ||
                        complaint.getStatus() == ComplaintStatus.COMPLETED ? complaint.getAdminNotes() : null)
                .timeline(timeline)
                .publicUpdates(publicUpdates)
                .build();
    }

    private List<ComplaintTrackingResponse.PublicUpdateDto> buildPublicUpdates(Complaint complaint) {
        if (complaint.getPublicUpdates() == null || complaint.getPublicUpdates().isEmpty()) {
            return new ArrayList<>();
        }

        return complaint.getPublicUpdates().stream()
                .map(update -> ComplaintTrackingResponse.PublicUpdateDto.builder()
                        .message(update.getContent())
                        .createdAt(update.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    private List<ComplaintTrackingResponse.StatusTimeline> buildTimeline(Complaint complaint) {
        List<ComplaintTrackingResponse.StatusTimeline> timeline = new ArrayList<>();

        timeline.add(ComplaintTrackingResponse.StatusTimeline.builder()
                .status("SUBMITTED")
                .description("Complaint submitted successfully")
                .timestamp(complaint.getCreatedAt())
                .build());

        if (complaint.getStatus() != ComplaintStatus.PENDING) {
            timeline.add(ComplaintTrackingResponse.StatusTimeline.builder()
                    .status(complaint.getStatus().name())
                    .description(getStatusDescription(complaint.getStatus()))
                    .timestamp(complaint.getUpdatedAt())
                    .build());
        }

        if (complaint.getReopenedAt() != null) {
            timeline.add(ComplaintTrackingResponse.StatusTimeline.builder()
                    .status("REOPENED")
                    .description("Complaint has been reopened for further review")
                    .timestamp(complaint.getReopenedAt())
                    .build());
        }

        if (complaint.getResolvedAt() != null) {
            timeline.add(ComplaintTrackingResponse.StatusTimeline.builder()
                    .status("RESOLVED")
                    .description("Complaint has been resolved")
                    .timestamp(complaint.getResolvedAt())
                    .build());
        }

        return timeline;
    }

    private String getStatusDescription(ComplaintStatus status) {
        return switch (status) {
            case PENDING -> "Your complaint is awaiting review";
            case IN_PROGRESS -> "Your complaint is being actively worked on";
            case COMPLETED -> "Work on your complaint has been completed, awaiting final review";
            case RESOLVED -> "Your complaint has been resolved";
            case REJECTED -> "Your complaint could not be processed";
            case WITHDRAWN -> "Your complaint has been withdrawn";
            case UNRESOLVED -> "Your complaint could not be resolved at this time";
            case REOPENED -> "Your complaint has been reopened for further review";
        };
    }
}
