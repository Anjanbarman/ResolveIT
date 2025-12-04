package com.example.resolveit.controller;

import com.example.resolveit.model.Notification;
import com.example.resolveit.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<?> getNotifications(Authentication authentication) {
        try {
            List<Notification> notifications = notificationService.getNotifications(authentication);
            return ResponseEntity.ok(notifications.stream().map(this::toDto).collect(Collectors.toList()));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/unread")
    public ResponseEntity<?> getUnreadNotifications(Authentication authentication) {
        try {
            List<Notification> notifications = notificationService.getUnreadNotifications(authentication);
            return ResponseEntity.ok(notifications.stream().map(this::toDto).collect(Collectors.toList()));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/count")
    public ResponseEntity<?> getUnreadCount(Authentication authentication) {
        try {
            long count = notificationService.getUnreadCount(authentication);
            return ResponseEntity.ok(Map.of("count", count));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id, Authentication authentication) {
        try {
            Notification notification = notificationService.markAsRead(id, authentication);
            return ResponseEntity.ok(toDto(notification));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(Authentication authentication) {
        try {
            notificationService.markAllAsRead(authentication);
            return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNotification(@PathVariable Long id, Authentication authentication) {
        try {
            notificationService.deleteNotification(id, authentication);
            return ResponseEntity.ok(Map.of("message", "Notification deleted"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        }
    }

    private Map<String, Object> toDto(Notification notification) {
        return Map.of(
                "id", notification.getId(),
                "title", notification.getTitle(),
                "message", notification.getMessage(),
                "type", notification.getType().name(),
                "isRead", notification.getIsRead(),
                "createdAt", notification.getCreatedAt().toString(),
                "complaintId", notification.getComplaint() != null ? notification.getComplaint().getId() : "");
    }
}
