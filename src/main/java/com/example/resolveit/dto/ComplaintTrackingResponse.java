package com.example.resolveit.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class ComplaintTrackingResponse {
    private String trackingId;
    private String title;
    private String category;
    private String status;
    private String statusDescription;
    private String priority;
    private LocalDate targetResolutionDate;
    private String assignedDepartment;
    private LocalDateTime submittedAt;
    private LocalDateTime lastUpdatedAt;
    private LocalDateTime resolvedAt;
    private String resolutionNotes;
    private List<StatusTimeline> timeline;
    private List<PublicUpdateDto> publicUpdates;

    @Data
    @Builder
    public static class StatusTimeline {
        private String status;
        private String description;
        private LocalDateTime timestamp;
    }

    @Data
    @Builder
    public static class PublicUpdateDto {
        private String message;
        private LocalDateTime createdAt;
    }
}
