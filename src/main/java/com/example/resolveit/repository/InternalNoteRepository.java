package com.example.resolveit.repository;

import com.example.resolveit.model.Complaint;
import com.example.resolveit.model.InternalNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InternalNoteRepository extends JpaRepository<InternalNote, Long> {
    List<InternalNote> findByComplaintOrderByCreatedAtAsc(Complaint complaint);
}
