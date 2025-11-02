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
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Complaint not found"));

        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElseThrow();

        if (user.getRole() != UserRole.ADMIN && user.getRole() != UserRole.OFFICER) {
            if (complaint.getReporter() == null || !complaint.getReporter().getId().equals(user.getId())) {
                throw new IllegalArgumentException("Access denied");
            }
        }

        return complaint;
    }

    public Complaint updateComplaint(Long id, String title, String description,
            ComplaintCategory category, ComplaintPriority priority,
            Authentication authentication) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Complaint not found"));

        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElseThrow();

        if (complaint.getReporter() == null || !complaint.getReporter().getId().equals(user.getId())) {
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
        Complaint complaint = complaintRepository.findById(id)
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
        Complaint complaint = complaintRepository.findById(id)
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

    public Complaint assignOfficer(Long complaintId, Long officerId, Authentication authentication) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new IllegalArgumentException("Complaint not found"));

        String email = authentication.getName();
        User admin = userRepository.findByEmail(email).orElseThrow();

        if (admin.getRole() != UserRole.ADMIN) {
            throw new IllegalArgumentException("Only admins can assign officers");
        }

        User officer = userRepository.findById(officerId)
                .orElseThrow(() -> new IllegalArgumentException("Officer not found"));

        if (officer.getRole() != UserRole.OFFICER) {
            throw new IllegalArgumentException("Selected user is not an officer");
        }

        complaint.setAssignedOfficer(officer);
        // Move to IN_PROGRESS upon assignment if not already
        // completed/resolved/withdrawn/rejected
        if (complaint.getStatus() == ComplaintStatus.PENDING) {
            complaint.setStatus(ComplaintStatus.IN_PROGRESS);
        }
        return complaintRepository.save(complaint);
    }

    public Complaint unassignOfficer(Long complaintId, Authentication authentication) {
        Complaint complaint = complaintRepository.findById(complaintId)
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
        Complaint complaint = complaintRepository.findById(complaintId)
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

        return internalNoteRepository.save(note);
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
        Complaint complaint = complaintRepository.findById(complaintId)
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

        return publicUpdateRepository.save(update);
    }

    public List<PublicUpdate> getPublicUpdates(Long complaintId, Authentication authentication) {
        Complaint complaint = complaintRepository.findById(complaintId)
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
