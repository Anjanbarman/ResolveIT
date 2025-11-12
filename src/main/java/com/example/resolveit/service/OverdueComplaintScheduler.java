package com.example.resolveit.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class OverdueComplaintScheduler {

    private final ComplaintService complaintService;

    // Run hourly to mark overdue complaints as UNRESOLVED
    @Scheduled(cron = "0 0 * * * *")
    public void markOverdue() {
        int changed = complaintService.markOverdueUnresolved();
        if (changed > 0) {
            log.info("Marked {} complaints as UNRESOLVED due to missed deadlines", changed);
        }
    }
}
