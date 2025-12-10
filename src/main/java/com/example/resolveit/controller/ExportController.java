package com.example.resolveit.controller;

import com.example.resolveit.model.*;
import com.example.resolveit.service.ComplaintService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/export")
@RequiredArgsConstructor
public class ExportController {

    private final ComplaintService complaintService;

    @GetMapping("/complaints")
    public ResponseEntity<byte[]> exportComplaints(
            @RequestParam(value = "ids", required = false) List<Long> ids,
            Authentication authentication) {
        try {
            List<Complaint> complaints;
            boolean isOfficer = authentication.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_OFFICER"));

            if (isOfficer) {
                complaints = complaintService.getAssignedComplaints(authentication);
            } else {
                complaints = complaintService.getAllComplaints(authentication);
            }

            if (ids != null && !ids.isEmpty()) {
                complaints = complaints.stream()
                        .filter(c -> ids.contains(c.getId()))
                        .collect(Collectors.toList());
            }

            StringBuilder csv = new StringBuilder();
            if (isOfficer) {
                csv.append("ID,Tracking ID,Title,Category,Priority,Status,Created At,Reporter,Assigned Officer\n");
            } else {
                csv.append(
                        "ID,Tracking ID,Title,Category,Priority,Status,Created At,Reporter,Assigned Officer,Public Updates\n");
            }

            for (Complaint c : complaints) {
                csv.append(escapeCsv(c.getId())).append(",");
                csv.append(escapeCsv(c.getTrackingId())).append(",");
                csv.append(escapeCsv(c.getTitle())).append(",");
                csv.append(escapeCsv(c.getCategory())).append(",");
                csv.append(escapeCsv(c.getPriority())).append(",");
                csv.append(escapeCsv(c.getStatus())).append(",");
                csv.append(escapeCsv(c.getCreatedAt())).append(",");

                String reporterName = c.getReporter() != null ? c.getReporter().getName() : c.getSubmitterName();
                csv.append(escapeCsv(reporterName)).append(",");

                String officerName = c.getAssignedOfficer() != null ? c.getAssignedOfficer().getName() : "Unassigned";
                csv.append(escapeCsv(officerName));

                if (!isOfficer) {
                    csv.append(",");
                    List<com.example.resolveit.model.PublicUpdate> updates = c.getPublicUpdates();
                    if (updates != null && !updates.isEmpty()) {
                        String publicUpdatesText = updates.stream()
                                .map(u -> u.getAuthor().getName() + " (" + u.getCreatedAt() + "): " + u.getContent())
                                .collect(Collectors.joining(" | "));
                        csv.append(escapeCsv(publicUpdatesText));
                    }
                }

                csv.append("\n");
            }

            String filename = "complaints_export_" + LocalDate.now() + ".csv";
            byte[] csvBytes = csv.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.parseMediaType("text/csv"))
                    .body(csvBytes);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(400).body(null);
        }
    }

    private String escapeCsv(Object value) {
        if (value == null)
            return "";
        String str = value.toString();
        if (str.contains(",") || str.contains("\"") || str.contains("\n")) {
            return "\"" + str.replace("\"", "\"\"") + "\"";
        }
        return str;
    }

    @GetMapping("/complaints-pdf")
    public ResponseEntity<byte[]> exportComplaintsPdf(
            @RequestParam(value = "ids", required = false) List<Long> ids,
            Authentication authentication) {
        try {
            List<Complaint> complaints;
            boolean isOfficer = authentication.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_OFFICER"));

            if (isOfficer) {
                complaints = complaintService.getAssignedComplaints(authentication);
            } else {
                complaints = complaintService.getAllComplaints(authentication);
            }

            if (ids != null && !ids.isEmpty()) {
                complaints = complaints.stream()
                        .filter(c -> ids.contains(c.getId()))
                        .collect(Collectors.toList());
            }

            java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
            com.itextpdf.kernel.pdf.PdfWriter writer = new com.itextpdf.kernel.pdf.PdfWriter(baos);
            com.itextpdf.kernel.pdf.PdfDocument pdf = new com.itextpdf.kernel.pdf.PdfDocument(writer);
            com.itextpdf.layout.Document document = new com.itextpdf.layout.Document(pdf,
                    com.itextpdf.kernel.geom.PageSize.A4.rotate());

            com.itextpdf.layout.element.Paragraph title = new com.itextpdf.layout.element.Paragraph("Complaints Report")
                    .setFont(com.itextpdf.kernel.font.PdfFontFactory
                            .createFont(com.itextpdf.io.font.constants.StandardFonts.HELVETICA_BOLD))
                    .setFontSize(18)
                    .setMarginBottom(10);
            document.add(title);

            float[] columnWidths = isOfficer
                    ? new float[] { 1, 2, 3, 2, 1.5f, 1.5f, 2, 2, 2 }
                    : new float[] { 1, 2, 3, 2, 1.5f, 1.5f, 2, 2, 2, 4 };

            com.itextpdf.layout.element.Table table = new com.itextpdf.layout.element.Table(columnWidths);
            table.setWidth(com.itextpdf.layout.properties.UnitValue.createPercentValue(100));

            String[] headers = isOfficer
                    ? new String[] { "ID", "Tracking ID", "Title", "Category", "Priority", "Status", "Created At",
                            "Reporter", "Assigned Officer" }
                    : new String[] { "ID", "Tracking ID", "Title", "Category", "Priority", "Status", "Created At",
                            "Reporter", "Assigned Officer", "Public Updates" };

            for (String header : headers) {
                table.addHeaderCell(new com.itextpdf.layout.element.Cell()
                        .add(new com.itextpdf.layout.element.Paragraph(header))
                        .setBackgroundColor(com.itextpdf.kernel.colors.ColorConstants.LIGHT_GRAY)
                        .setFont(com.itextpdf.kernel.font.PdfFontFactory
                                .createFont(com.itextpdf.io.font.constants.StandardFonts.HELVETICA_BOLD))
                        .setFontSize(8));
            }

            for (Complaint c : complaints) {
                table.addCell(createCell(String.valueOf(c.getId())));
                table.addCell(createCell(c.getTrackingId()));
                table.addCell(createCell(c.getTitle()));
                table.addCell(createCell(c.getCategory().toString()));
                table.addCell(createCell(c.getPriority().toString()));
                table.addCell(createCell(c.getStatus().toString()));
                table.addCell(createCell(c.getCreatedAt().toString()));

                String reporterName = c.getReporter() != null ? c.getReporter().getName() : c.getSubmitterName();
                table.addCell(createCell(reporterName));

                String officerName = c.getAssignedOfficer() != null ? c.getAssignedOfficer().getName() : "Unassigned";
                table.addCell(createCell(officerName));

                if (!isOfficer) {
                    List<com.example.resolveit.model.PublicUpdate> updates = c.getPublicUpdates();
                    String updatesText = "";
                    if (updates != null && !updates.isEmpty()) {
                        updatesText = updates.stream()
                                .map(u -> u.getAuthor().getName() + " (" + u.getCreatedAt() + "): " + u.getContent())
                                .collect(Collectors.joining(" | "));
                    }
                    table.addCell(createCell(updatesText));
                }
            }

            document.add(table);
            document.close();

            String filename = "complaints_export_" + LocalDate.now() + ".pdf";
            byte[] pdfBytes = baos.toByteArray();

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdfBytes);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(400).body(null);
        }
    }

    private com.itextpdf.layout.element.Cell createCell(String content) throws java.io.IOException {
        return new com.itextpdf.layout.element.Cell()
                .add(new com.itextpdf.layout.element.Paragraph(content != null ? content : ""))
                .setFont(com.itextpdf.kernel.font.PdfFontFactory
                        .createFont(com.itextpdf.io.font.constants.StandardFonts.HELVETICA))
                .setFontSize(7);
    }
}
