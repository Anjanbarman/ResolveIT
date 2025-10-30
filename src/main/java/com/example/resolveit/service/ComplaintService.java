package com.example.resolveit.service;

import com.example.resolveit.model.*;
import com.example.resolveit.repository.ComplaintRepository;
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

        if (user.getRole() == UserRole.ADMIN || user.getRole() == UserRole.OFFICER) {
            return complaintRepository.findAllByOrderByCreatedAtDesc();
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

        if (user.getRole() != UserRole.ADMIN && user.getRole() != UserRole.OFFICER) {
            throw new IllegalArgumentException("Access denied");
        }

        complaint.setStatus(status);
        if (adminNotes != null) {
            complaint.setAdminNotes(adminNotes);
        }
        if (status == ComplaintStatus.RESOLVED || status == ComplaintStatus.REJECTED) {
            complaint.setResolvedAt(LocalDateTime.now());
        }

        return complaintRepository.save(complaint);
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
