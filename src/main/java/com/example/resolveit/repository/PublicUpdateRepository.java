package com.example.resolveit.repository;

import com.example.resolveit.model.Complaint;
import com.example.resolveit.model.PublicUpdate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PublicUpdateRepository extends JpaRepository<PublicUpdate, Long> {
    List<PublicUpdate> findByComplaintOrderByCreatedAtAsc(Complaint complaint);
}
