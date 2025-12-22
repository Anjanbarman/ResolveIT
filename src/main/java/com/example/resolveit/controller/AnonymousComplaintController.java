package com.example.resolveit.controller;

import com.example.resolveit.dto.ComplaintTrackingResponse;
import com.example.resolveit.model.ComplaintCategory;
import com.example.resolveit.service.AnonymousComplaintService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/anonymous")
@RequiredArgsConstructor
public class AnonymousComplaintController {

    private final AnonymousComplaintService anonymousComplaintService;

    @GetMapping("/track/{trackingId}")
    public ResponseEntity<ComplaintTrackingResponse> trackComplaint(
            @PathVariable String trackingId) {

        ComplaintTrackingResponse response = anonymousComplaintService.trackComplaint(trackingId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/categories")
    public ResponseEntity<List<Map<String, String>>> getCategories() {
        List<Map<String, String>> categories = Arrays.stream(ComplaintCategory.values())
                .map(cat -> Map.of(
                        "id", cat.name(),
                        "name", formatCategoryName(cat.name()),
                        "description", getCategoryDescription(cat)))
                .collect(Collectors.toList());
        return ResponseEntity.ok(categories);
    }

    private String formatCategoryName(String name) {
        return Arrays.stream(name.split("_"))
                .map(word -> word.charAt(0) + word.substring(1).toLowerCase())
                .collect(Collectors.joining(" "));
    }

    private String getCategoryDescription(ComplaintCategory category) {
        return switch (category) {
            case SANITATION -> "Garbage, drainage, cleanliness issues";
            case TRAFFIC -> "Traffic congestion, road safety, signals";
            case WATER -> "Water supply, quality, drainage issues";
            case OTHER -> "Other issues not listed above";
        };
    }
}
