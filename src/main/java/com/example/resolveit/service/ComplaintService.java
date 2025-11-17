package com.example.resolveit.service;

import com.example.resolveit.model.*;
import com.example.resolveit.repository.ComplaintRepository;
import com.example.resolveit.repository.InternalNoteRepository;
import com.example.resolveit.repository.PublicUpdateRepository;
import com.example.resolveit.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;
    private final InternalNoteRepository internalNoteRepository;
    private final PublicUpdateRepository publicUpdateRepository;
    private static final String UPLOAD_DIR = "uploads/complaints";

    public Complaint createComplaint(String title, String description, ComplaintCategory category,
            ComplaintPriority priority, MultipartFile file,
            String submitterName, String submitterContact,
            Authentication authentication) throws IOException {
        Complaint complaint = Complaint.builder()
                .title(title)
                .description(description)
                .category(category)
                .priority(priority != null ? priority : ComplaintPriority.MEDIUM)
                .status(ComplaintStatus.PENDING)
                .build();

        // Generate unique tracking ID
        complaint.setTrackingId(generateTrackingId());

        if (authentication != null && authentication.isAuthenticated()
                && !"anonymousUser".equals(authentication.getName())) {
            String email = authentication.getName();
            User user = userRepository.findByEmail(email).orElse(null);
            if (user != null) {
                // Only citizens can create complaints when authenticated
                if (user.getRole() != UserRole.CITIZEN) {
                    throw new IllegalArgumentException("Only citizens can create complaints");
                }
                complaint.setReporter(user);
            } else {
                complaint.setSubmitterName(submitterName);
                complaint.setSubmitterContact(submitterContact);
            }
        } else {
            complaint.setSubmitterName(submitterName);
            complaint.setSubmitterContact(submitterContact);
        }

        if (file != null && !file.isEmpty()) {
            String filename = saveFile(file);
            complaint.setAttachmentPath(filename);
        }

        return complaintRepository.save(complaint);
    }

    public List<Complaint> getAllComplaints(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElseThrow();

        if (user.getRole() == UserRole.ADMIN) {
            return complaintRepository.findAllByOrderByCreatedAtDesc();
        } else if (user.getRole() == UserRole.OFFICER) {
            // Officers see only their assigned complaints
            return complaintRepository.findByAssignedOfficerOrderByCreatedAtDesc(user);
        } else {
            return complaintRepository.findByReporterOrderByCreatedAtDesc(user);
        }
    }

    public Complaint getComplaintById(Long id, Authentication authentication) {
        Long safeId = java.util.Objects.requireNonNull(id, "id cannot be null");
        Complaint complaint = complaintRepository.findById(safeId)
                .orElseThrow(() -> new IllegalArgumentException("Complaint not found"));

        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElseThrow();

        // Admin can view any complaint
        if (user.getRole() == UserRole.ADMIN) {
            return complaint;
        }

        // Officer can view any complaint (especially those assigned to them)
        if (user.getRole() == UserRole.OFFICER) {
            return complaint;
        }

        // Citizen can only view their own complaints
        if (user.getRole() == UserRole.CITIZEN) {
            if (complaint.getReporter() == null || !complaint.getReporter().getId().equals(user.getId())) {
                throw new IllegalArgumentException("Access denied");
            }
            return complaint;
        }

        throw new IllegalArgumentException("Access denied");
    }

    public Complaint updateComplaint(Long id, String title, String description,
            ComplaintCategory category, ComplaintPriority priority,
            Authentication authentication) {
        Long safeId = java.util.Objects.requireNonNull(id, "id cannot be null");
        Complaint complaint = complaintRepository.findById(safeId)
                .orElseThrow(() -> new IllegalArgumentException("Complaint not found"));

        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElseThrow();

        if (complaint.getReporter() != null && !complaint.getReporter().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Access denied");
        }

        if (complaint.getStatus() != ComplaintStatus.PENDING) {
            throw new IllegalArgumentException("Can only edit pending complaints");
        }

        complaint.setTitle(title);
        complaint.setDescription(description);
        complaint.setCategory(category);
        complaint.setPriority(priority);

        return complaintRepository.save(complaint);
    }

    public void withdrawComplaint(Long id, Authentication authentication) {
        Long safeId = java.util.Objects.requireNonNull(id, "id cannot be null");
        Complaint complaint = complaintRepository.findById(safeId)
                .orElseThrow(() -> new IllegalArgumentException("Complaint not found"));

        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElseThrow();

        if (complaint.getReporter() == null || !complaint.getReporter().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Access denied");
        }

        if (complaint.getStatus() != ComplaintStatus.PENDING) {
            throw new IllegalArgumentException("Can only withdraw pending complaints");
        }

        complaint.setStatus(ComplaintStatus.WITHDRAWN);
        complaintRepository.save(complaint);
    }

    public Complaint updateStatus(Long id, ComplaintStatus status, String adminNotes, Authentication authentication) {
        Long safeId = java.util.Objects.requireNonNull(id, "id cannot be null");
        Complaint complaint = complaintRepository.findById(safeId)
                .orElseThrow(() -> new IllegalArgumentException("Complaint not found"));

        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElseThrow();

        if (user.getRole() == UserRole.OFFICER) {
            if (complaint.getAssignedOfficer() == null
                    || !complaint.getAssignedOfficer().getId().equals(user.getId())) {
                throw new IllegalArgumentException("Only the assigned officer can update status");
            }
            if (status != ComplaintStatus.COMPLETED) {
                throw new IllegalArgumentException("Officers can only mark a complaint as COMPLETED");
            }
            // Allow officer to mark completed only from IN_PROGRESS
            if (complaint.getStatus() != ComplaintStatus.IN_PROGRESS) {
                throw new IllegalArgumentException("Complaint must be IN_PROGRESS to be completed by officer");
            }
            complaint.setStatus(ComplaintStatus.COMPLETED);
        } else if (user.getRole() == UserRole.ADMIN) {
            // Admin can mark as RESOLVED (after officer completion) or REJECTED
            if (status == ComplaintStatus.RESOLVED) {
                if (complaint.getStatus() != ComplaintStatus.COMPLETED) {
                    throw new IllegalArgumentException("Complaint must be COMPLETED by officer before resolving");
                }
                complaint.setStatus(ComplaintStatus.RESOLVED);
                complaint.setResolvedAt(LocalDateTime.now());
            } else if (status == ComplaintStatus.REJECTED) {
                complaint.setStatus(ComplaintStatus.REJECTED);
                complaint.setResolvedAt(LocalDateTime.now());
            } else if (status == ComplaintStatus.IN_PROGRESS) {
                complaint.setStatus(ComplaintStatus.IN_PROGRESS);
            } else if (status == ComplaintStatus.WITHDRAWN) {
                complaint.setStatus(ComplaintStatus.WITHDRAWN);
            } else if (status == ComplaintStatus.UNRESOLVED) {
                complaint.setStatus(ComplaintStatus.UNRESOLVED);
            } else if (status == ComplaintStatus.REOPENED) {
                complaint.setStatus(ComplaintStatus.REOPENED);
            } else if (status == ComplaintStatus.COMPLETED) {
                // Admin should not directly set COMPLETED
                throw new IllegalArgumentException("Admins cannot set status to COMPLETED");
            } else if (status == ComplaintStatus.PENDING) {
                complaint.setStatus(ComplaintStatus.PENDING);
            } else {
                throw new IllegalArgumentException("Unsupported status transition");
            }
            if (adminNotes != null) {
                complaint.setAdminNotes(adminNotes);
            }
        } else {
            throw new IllegalArgumentException("Access denied");
        }

        return complaintRepository.save(complaint);
    }

    public Complaint assignOfficer(Long complaintId, Long officerId, LocalDate targetResolutionDate,
            Authentication authentication) {
        Long safeComplaintId = java.util.Objects.requireNonNull(complaintId, "complaintId cannot be null");
        Complaint complaint = complaintRepository.findById(safeComplaintId)
                .orElseThrow(() -> new IllegalArgumentException("Complaint not found"));

        String email = authentication.getName();
        User admin = userRepository.findByEmail(email).orElseThrow();

        if (admin.getRole() != UserRole.ADMIN) {
            throw new IllegalArgumentException("Only admins can assign officers");
        }

        Long safeOfficerId = java.util.Objects.requireNonNull(officerId, "officerId cannot be null");
        User officer = userRepository.findById(safeOfficerId)
                .orElseThrow(() -> new IllegalArgumentException("Officer not found"));

        if (officer.getRole() != UserRole.OFFICER) {
            throw new IllegalArgumentException("Selected user is not an officer");
        }

        complaint.setAssignedOfficer(officer);
        complaint.setTargetResolutionDate(targetResolutionDate);
        if (complaint.getStatus() == ComplaintStatus.PENDING
                || complaint.getStatus() == ComplaintStatus.UNRESOLVED
                || complaint.getStatus() == ComplaintStatus.REOPENED) {
            complaint.setStatus(ComplaintStatus.IN_PROGRESS);
        }
        return complaintRepository.save(complaint);
    }

    public Complaint updateComplaintDeadline(Long complaintId, LocalDate targetResolutionDate,
            Authentication authentication) {
        String email = authentication.getName();
        User admin = userRepository.findByEmail(email).orElseThrow();
        if (admin.getRole() != UserRole.ADMIN) {
            throw new IllegalArgumentException("Only admins can update deadlines");
        }
        Long safeComplaintId = java.util.Objects.requireNonNull(complaintId, "complaintId cannot be null");
        Complaint complaint = complaintRepository.findById(safeComplaintId)
                .orElseThrow(() -> new IllegalArgumentException("Complaint not found"));
        complaint.setTargetResolutionDate(targetResolutionDate);
        return complaintRepository.save(complaint);
    }

    public Complaint unassignOfficer(Long complaintId, Authentication authentication) {
        Long safeComplaintId = java.util.Objects.requireNonNull(complaintId, "complaintId cannot be null");
        Complaint complaint = complaintRepository.findById(safeComplaintId)
                .orElseThrow(() -> new IllegalArgumentException("Complaint not found"));

        String email = authentication.getName();
        User admin = userRepository.findByEmail(email).orElseThrow();

        if (admin.getRole() != UserRole.ADMIN) {
            throw new IllegalArgumentException("Only admins can unassign officers");
        }

        if (complaint.getStatus() == ComplaintStatus.RESOLVED || complaint.getStatus() == ComplaintStatus.REJECTED) {
            throw new IllegalArgumentException("Cannot unassign a resolved or rejected complaint");
        }

        complaint.setAssignedOfficer(null);
        if (complaint.getStatus() == ComplaintStatus.IN_PROGRESS) {
            complaint.setStatus(ComplaintStatus.PENDING);
        }
        return complaintRepository.save(complaint);
    }

    public List<User> getOfficers() {
        return userRepository.findByRole(UserRole.OFFICER);
    }

    public InternalNote addInternalNote(Long complaintId, String content, Authentication authentication) {
        Long safeComplaintId = java.util.Objects.requireNonNull(complaintId, "complaintId cannot be null");
        Complaint complaint = complaintRepository.findById(safeComplaintId)
                .orElseThrow(() -> new IllegalArgumentException("Complaint not found"));

        String email = authentication.getName();
        User author = userRepository.findByEmail(email).orElseThrow();

        if (author.getRole() != UserRole.ADMIN && author.getRole() != UserRole.OFFICER) {
            throw new IllegalArgumentException("Only admins and officers can add internal notes");
        }

        InternalNote note = InternalNote.builder()
                .complaint(complaint)
                .author(author)
                .content(content)
                .build();

        @SuppressWarnings("null")
        InternalNote saved = internalNoteRepository.save(note);
        return saved;
    }

    public List<InternalNote> getInternalNotes(Long complaintId, Authentication authentication) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new IllegalArgumentException("Complaint not found"));

        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElseThrow();

        if (user.getRole() != UserRole.ADMIN && user.getRole() != UserRole.OFFICER) {
            throw new IllegalArgumentException("Only admins and officers can view internal notes");
        }

        return internalNoteRepository.findByComplaintOrderByCreatedAtAsc(complaint);
    }

    public PublicUpdate addPublicUpdate(Long complaintId, String content, Authentication authentication) {
        Long safeComplaintId = java.util.Objects.requireNonNull(complaintId, "complaintId cannot be null");
        Complaint complaint = complaintRepository.findById(safeComplaintId)
                .orElseThrow(() -> new IllegalArgumentException("Complaint not found"));

        String email = authentication.getName();
        User author = userRepository.findByEmail(email).orElseThrow();

        // Only admins can add public updates
        if (author.getRole() != UserRole.ADMIN) {
            throw new IllegalArgumentException("Only admins can add public updates");
        }

        PublicUpdate update = PublicUpdate.builder()
                .complaint(complaint)
                .author(author)
                .content(content)
                .build();

        @SuppressWarnings("null")
        PublicUpdate saved = publicUpdateRepository.save(update);
        return saved;
    }

    public List<PublicUpdate> getPublicUpdates(Long complaintId, Authentication authentication) {
        Long safeComplaintId = java.util.Objects.requireNonNull(complaintId, "complaintId cannot be null");
        Complaint complaint = complaintRepository.findById(safeComplaintId)
                .orElseThrow(() -> new IllegalArgumentException("Complaint not found"));

        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElseThrow();

        if (user.getRole() == UserRole.ADMIN) {
            return publicUpdateRepository.findByComplaintOrderByCreatedAtAsc(complaint);
        }

        if (user.getRole() == UserRole.OFFICER) {
            throw new IllegalArgumentException("Access denied");
        }

        // Citizen: only if they are the reporter
        if (user.getRole() == UserRole.CITIZEN) {
            if (complaint.getReporter() != null && complaint.getReporter().getId().equals(user.getId())) {
                return publicUpdateRepository.findByComplaintOrderByCreatedAtAsc(complaint);
            }
            throw new IllegalArgumentException("Access denied");
        }

        throw new IllegalArgumentException("Access denied");
    }

    public List<Complaint> getAssignedComplaints(Authentication authentication) {
        String email = authentication.getName();
        User officer = userRepository.findByEmail(email).orElseThrow();

        if (officer.getRole() != UserRole.OFFICER) {
            throw new IllegalArgumentException("Only officers can view assigned complaints");
        }

        return complaintRepository.findByAssignedOfficerOrderByCreatedAtDesc(officer);
    }

    // Citizen reopen
    public Complaint reopenComplaint(Long id, String feedback, Authentication authentication) {
        Long safeId = java.util.Objects.requireNonNull(id, "id cannot be null");
        Complaint complaint = complaintRepository.findById(safeId)
                .orElseThrow(() -> new IllegalArgumentException("Complaint not found"));
        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElseThrow();
        if (user.getRole() != UserRole.CITIZEN) {
            throw new IllegalArgumentException("Only citizens can reopen complaints");
        }
        // Allow reopening if:
        // 1. Complaint has a reporter and it's the same user, OR
        // 2. Complaint has no reporter (anonymous submission) – any authenticated
        // citizen may reopen using tracking link
        if (complaint.getReporter() != null && !complaint.getReporter().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Access denied");
        }
        if (complaint.getStatus() != ComplaintStatus.RESOLVED) {
            throw new IllegalArgumentException("Only resolved complaints can be reopened");
        }
        complaint.setStatus(ComplaintStatus.REOPENED);
        complaint.setReopenedAt(LocalDateTime.now());
        complaint.setAssignedOfficer(null);

        // If feedback is provided, add it as a public update
        if (feedback != null && !feedback.trim().isEmpty()) {
            PublicUpdate update = PublicUpdate.builder()
                    .complaint(complaint)
                    .author(user)
                    .content("Reopening Reason: " + feedback)
                    .build();
            publicUpdateRepository.save(update);
        }

        return complaintRepository.save(complaint);
    }

    // In-memory search for simplicity
    public List<Complaint> searchComplaints(String trackingId, String keyword, ComplaintCategory category,
            ComplaintPriority priority, ComplaintStatus status, LocalDate fromDate, LocalDate toDate,
            Authentication authentication) {
        List<Complaint> base = getAllComplaints(authentication);
        return base.stream().filter(c -> {
            if (trackingId != null && !trackingId.isEmpty() && !c.getTrackingId().equalsIgnoreCase(trackingId))
                return false;
            if (keyword != null && !keyword.isEmpty()) {
                String kw = keyword.toLowerCase();
                if (!(c.getTitle().toLowerCase().contains(kw) || c.getDescription().toLowerCase().contains(kw)))
                    return false;
            }
            if (category != null && c.getCategory() != category)
                return false;
            if (priority != null && c.getPriority() != priority)
                return false;
            if (status != null) {
                if (status == ComplaintStatus.IN_PROGRESS) {
                    if (!(c.getStatus() == ComplaintStatus.IN_PROGRESS || c.getStatus() == ComplaintStatus.COMPLETED))
                        return false;
                } else if (c.getStatus() != status)
                    return false;
            }
            if (fromDate != null && c.getCreatedAt().toLocalDate().isBefore(fromDate))
                return false;
            if (toDate != null && c.getCreatedAt().toLocalDate().isAfter(toDate))
                return false;
            return true;
        }).toList();
    }

    // Metrics (basic)
    public DashboardMetrics getAdminMetrics(Authentication authentication) {
        String email = authentication.getName();
        User admin = userRepository.findByEmail(email).orElseThrow();
        if (admin.getRole() != UserRole.ADMIN)
            throw new IllegalArgumentException("Access denied");
        List<Complaint> all = complaintRepository.findAll();
        long total = all.size();
        long resolved = all.stream().filter(c -> c.getStatus() == ComplaintStatus.RESOLVED).count();
        long pending = all.stream().filter(c -> c.getStatus() == ComplaintStatus.PENDING).count();
        long inProgress = all.stream()
                .filter(c -> c.getStatus() == ComplaintStatus.IN_PROGRESS || c.getStatus() == ComplaintStatus.COMPLETED)
                .count();
        long unresolved = all.stream().filter(c -> c.getStatus() == ComplaintStatus.UNRESOLVED).count();
        double avgHours = all.stream()
                .filter(c -> c.getStatus() == ComplaintStatus.RESOLVED && c.getResolvedAt() != null)
                .mapToLong(c -> java.time.Duration.between(c.getCreatedAt(), c.getResolvedAt()).toHours()).average()
                .orElse(0);
        return new DashboardMetrics(total, resolved, pending, inProgress, unresolved, avgHours);
    }

    public DashboardMetrics getOfficerMetrics(Authentication authentication) {
        String email = authentication.getName();
        User officer = userRepository.findByEmail(email).orElseThrow();
        if (officer.getRole() != UserRole.OFFICER)
            throw new IllegalArgumentException("Access denied");
        List<Complaint> assigned = complaintRepository.findByAssignedOfficerOrderByCreatedAtDesc(officer);
        long totalActive = assigned
                .stream().filter(c -> c.getStatus() != ComplaintStatus.RESOLVED
                        && c.getStatus() != ComplaintStatus.REJECTED && c.getStatus() != ComplaintStatus.WITHDRAWN)
                .count();
        long completed = assigned.stream().filter(c -> c.getStatus() == ComplaintStatus.COMPLETED).count();
        long pending = assigned.stream().filter(c -> c.getStatus() == ComplaintStatus.PENDING).count();
        long inProgress = assigned.stream()
                .filter(c -> c.getStatus() == ComplaintStatus.IN_PROGRESS || c.getStatus() == ComplaintStatus.COMPLETED)
                .count();
        double avgHours = assigned.stream()
                .filter(c -> c.getStatus() == ComplaintStatus.RESOLVED && c.getResolvedAt() != null)
                .mapToLong(c -> java.time.Duration.between(c.getCreatedAt(), c.getResolvedAt()).toHours()).average()
                .orElse(0);
        return new DashboardMetrics(totalActive, completed, pending, inProgress, 0, avgHours);
    }

    public int markOverdueUnresolved() {
        LocalDate today = LocalDate.now();
        List<Complaint> all = complaintRepository.findAll();
        int changed = 0;
        for (Complaint c : all) {
            if (c.getTargetResolutionDate() != null && c.getTargetResolutionDate().isBefore(today)
                    && c.getStatus() != ComplaintStatus.RESOLVED
                    && c.getStatus() != ComplaintStatus.REJECTED
                    && c.getStatus() != ComplaintStatus.WITHDRAWN
                    && c.getStatus() != ComplaintStatus.UNRESOLVED) {
                c.setStatus(ComplaintStatus.UNRESOLVED);
                complaintRepository.save(c);
                changed++;
            }
        }
        return changed;
    }

    private String generateTrackingId() {
        String year = String.valueOf(LocalDate.now().getYear());
        String rand = UUID.randomUUID().toString().replaceAll("-", "").substring(0, 6).toUpperCase();
        return "C-" + year + "-" + rand;
    }

    @lombok.Getter
    @lombok.AllArgsConstructor
    public static class DashboardMetrics {
        private long total;
        private long resolvedOrCompleted;
        private long pending;
        private long inProgress;
        private long unresolved;
        private double averageResolutionHours;
    }

    private String saveFile(MultipartFile file) throws IOException {
        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String filename = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        Path filePath = uploadPath.resolve(filename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        return filename;
    }
}
