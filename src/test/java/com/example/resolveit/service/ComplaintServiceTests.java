package com.example.resolveit.service;

import com.example.resolveit.model.*;
import com.example.resolveit.repository.ComplaintRepository;
import com.example.resolveit.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.Authentication;

import java.time.LocalDate;
// Removed unused import

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class ComplaintServiceTests {

        @Autowired
        ComplaintService complaintService;
        @Autowired
        ComplaintRepository complaintRepository;
        @Autowired
        UserRepository userRepository;

        User citizen;
        User admin;
        User officer;
        Authentication citizenAuth;
        Authentication adminAuth;
        Authentication officerAuth;

        @BeforeEach
        void setup() {
                complaintRepository.deleteAll();
                userRepository.deleteAll();
                citizen = userRepository.save(User.builder().name("Citizen").email("citizen@test.local").password("x")
                                .role(UserRole.CITIZEN).build());
                admin = userRepository.save(
                                User.builder().name("Admin").email("admin@test.local").password("x")
                                                .role(UserRole.ADMIN).build());
                officer = userRepository.save(User.builder().name("Officer").email("officer@test.local").password("x")
                                .role(UserRole.OFFICER).build());
                citizenAuth = new TestingAuthenticationToken(citizen.getEmail(), "x");
                adminAuth = new TestingAuthenticationToken(admin.getEmail(), "x");
                officerAuth = new TestingAuthenticationToken(officer.getEmail(), "x");
        }

        @Test
        void marksOverdueComplaintAsUnresolved() throws Exception {
                Complaint c = complaintService.createComplaint("Title", "Desc", ComplaintCategory.OTHER,
                                ComplaintPriority.MEDIUM, null, null, null, citizenAuth);
                // assign with past deadline
                complaintService.assignOfficer(c.getId(), officer.getId(), LocalDate.now().minusDays(1), adminAuth);
                int changed = complaintService.markOverdueUnresolved();
                Complaint updated = complaintRepository.findById(c.getId()).orElseThrow();
                assertThat(changed).isEqualTo(1);
                assertThat(updated.getStatus()).isEqualTo(ComplaintStatus.UNRESOLVED);
        }

        @Test
        void citizenCanReopenResolvedComplaint() throws Exception {
                Complaint c = complaintService.createComplaint("Title2", "Desc2", ComplaintCategory.OTHER,
                                ComplaintPriority.MEDIUM, null, null, null, citizenAuth);
                // assign and complete lifecycle to resolved
                complaintService.assignOfficer(c.getId(), officer.getId(), LocalDate.now().plusDays(2), adminAuth);
                // officer marks completed
                complaintService.updateStatus(c.getId(), ComplaintStatus.COMPLETED, null, officerAuth);
                complaintService.updateStatus(c.getId(), ComplaintStatus.RESOLVED, null, adminAuth);
                Complaint reopened = complaintService.reopenComplaint(c.getId(), "Not satisfied with the resolution",
                                citizenAuth);
                assertThat(reopened.getStatus()).isEqualTo(ComplaintStatus.REOPENED);
                assertThat(reopened.getReopenedAt()).isNotNull();
        }
}
