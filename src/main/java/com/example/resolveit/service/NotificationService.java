package com.example.resolveit.service;

import com.example.resolveit.model.*;
import com.example.resolveit.repository.NotificationRepository;
import com.example.resolveit.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    /**
     * Create a notification for a specific user
     */
    public Notification createNotification(User user, Complaint complaint, String title, String message,
            NotificationType type) {
        Notification notification = Notification.builder()
                .user(user)
                .complaint(complaint)
                .title(title)
                .message(message)
                .type(type)
                .isRead(false)
                .build();
        return notificationRepository.save(notification);
    }

    /**
     * Notify citizen when their complaint status changes
     */
    public void notifyStatusChange(Complaint complaint, ComplaintStatus oldStatus, ComplaintStatus newStatus) {
        User reporter = complaint.getReporter();
        if (reporter == null) {
            return; // Anonymous complaint, cannot notify
        }

        String title = "Complaint Status Updated";
        String message = String.format("Your complaint \"%s\" (ID: %s) status changed from %s to %s",
                complaint.getTitle(),
                complaint.getTrackingId(),
                formatStatus(oldStatus),
                formatStatus(newStatus));

        NotificationType type = NotificationType.STATUS_CHANGE;
        if (newStatus == ComplaintStatus.RESOLVED) {
            type = NotificationType.RESOLUTION;
            title = "Complaint Resolved";
            message = String.format("Great news! Your complaint \"%s\" (ID: %s) has been resolved.",
                    complaint.getTitle(), complaint.getTrackingId());
        } else if (newStatus == ComplaintStatus.REJECTED) {
            title = "Complaint Rejected";
            message = String.format(
                    "Your complaint \"%s\" (ID: %s) has been rejected. Please check the details for more information.",
                    complaint.getTitle(), complaint.getTrackingId());
        }

        createNotification(reporter, complaint, title, message, type);
    }

    /**
     * Notify officer when a complaint is assigned to them
     */
    public void notifyOfficerAssignment(Complaint complaint, User officer) {
        String title = "New Complaint Assigned";
        String message = String.format(
                "You have been assigned to complaint \"%s\" (ID: %s). Category: %s, Priority: %s",
                complaint.getTitle(),
                complaint.getTrackingId(),
                complaint.getCategory(),
                complaint.getPriority());

        NotificationType type = complaint.getPriority() == ComplaintPriority.HIGH ? NotificationType.URGENT
                : NotificationType.ASSIGNMENT;

        createNotification(officer, complaint, title, message, type);
    }

    /**
     * Notify officer when they are unassigned from a complaint
     */
    public void notifyOfficerUnassignment(Complaint complaint, User officer) {
        String title = "Complaint Unassigned";
        String message = String.format("You have been unassigned from complaint \"%s\" (ID: %s).",
                complaint.getTitle(), complaint.getTrackingId());

        createNotification(officer, complaint, title, message, NotificationType.INFO);
    }

    /**
     * Notify admin when officer marks complaint as completed
     */
    public void notifyAdminComplaintCompleted(Complaint complaint, List<User> admins) {
        String title = "Complaint Awaiting Review";
        String message = String.format(
                "Complaint \"%s\" (ID: %s) has been marked as COMPLETED by the assigned officer and is awaiting your review.",
                complaint.getTitle(), complaint.getTrackingId());

        for (User admin : admins) {
            createNotification(admin, complaint, title, message, NotificationType.INFO);
        }
    }

    /**
     * Notify admin when a complaint is reopened
     */
    public void notifyAdminComplaintReopened(Complaint complaint, List<User> admins) {
        String title = "Complaint Reopened";
        String message = String.format("Complaint \"%s\" (ID: %s) has been reopened by the citizen.",
                complaint.getTitle(), complaint.getTrackingId());

        for (User admin : admins) {
            createNotification(admin, complaint, title, message, NotificationType.URGENT);
        }
    }

    /**
     * Notify citizen when a public update is added
     */
    public void notifyPublicUpdate(Complaint complaint) {
        User reporter = complaint.getReporter();
        if (reporter == null) {
            return;
        }

        String title = "New Update on Your Complaint";
        String message = String.format("A new public update has been posted on your complaint \"%s\" (ID: %s).",
                complaint.getTitle(), complaint.getTrackingId());

        createNotification(reporter, complaint, title, message, NotificationType.INFO);
    }

    /**
     * Notify officer when a new complaint is created (for admins to review)
     */
    public void notifyNewComplaint(Complaint complaint, List<User> admins) {
        String title = "New Complaint Submitted";
        String message = String.format("A new complaint \"%s\" (ID: %s) has been submitted. Category: %s, Priority: %s",
                complaint.getTitle(),
                complaint.getTrackingId(),
                complaint.getCategory(),
                complaint.getPriority());

        NotificationType type = complaint.getPriority() == ComplaintPriority.HIGH ? NotificationType.URGENT
                : NotificationType.INFO;

        for (User admin : admins) {
            createNotification(admin, complaint, title, message, type);
        }
    }

    /**
     * Get all notifications for current user
     */
    public List<Notification> getNotifications(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElseThrow();
        return notificationRepository.findByUserOrderByCreatedAtDesc(user);
    }

    /**
     * Get unread notifications for current user
     */
    public List<Notification> getUnreadNotifications(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElseThrow();
        return notificationRepository.findByUserAndIsReadFalseOrderByCreatedAtDesc(user);
    }

    /**
     * Get unread notification count for current user
     */
    public long getUnreadCount(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElseThrow();
        return notificationRepository.countByUserAndIsReadFalse(user);
    }

    /**
     * Mark a notification as read
     */
    public Notification markAsRead(Long notificationId, Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElseThrow();

        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));

        if (!notification.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Access denied");
        }

        notification.setIsRead(true);
        return notificationRepository.save(notification);
    }

    /**
     * Mark all notifications as read for current user
     */
    public void markAllAsRead(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElseThrow();

        List<Notification> unread = notificationRepository.findByUserAndIsReadFalseOrderByCreatedAtDesc(user);
        for (Notification n : unread) {
            n.setIsRead(true);
            notificationRepository.save(n);
        }
    }

    /**
     * Delete a notification
     */
    public void deleteNotification(Long notificationId, Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElseThrow();

        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));

        if (!notification.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Access denied");
        }

        notificationRepository.delete(notification);
    }

    private String formatStatus(ComplaintStatus status) {
        if (status == null)
            return "Unknown";
        return status.name().replace("_", " ");
    }
}
