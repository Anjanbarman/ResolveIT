package com.example.resolveit.repository;

import com.example.resolveit.model.Complaint;
import com.example.resolveit.model.ComplaintStatus;
import com.example.resolveit.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long> {
    List<Complaint> findByReporter(User reporter);

    List<Complaint> findByReporterOrderByCreatedAtDesc(User reporter);

    List<Complaint> findByStatusOrderByCreatedAtDesc(ComplaintStatus status);

    List<Complaint> findAllByOrderByCreatedAtDesc();

    List<Complaint> findByAssignedOfficerOrderByCreatedAtDesc(User assignedOfficer);

    Complaint findByTrackingId(String trackingId);

    Optional<Complaint> findOptionalByTrackingId(String trackingId);

    Complaint findByAttachmentPath(String attachmentPath);

    boolean existsByTrackingId(String trackingId);
}
