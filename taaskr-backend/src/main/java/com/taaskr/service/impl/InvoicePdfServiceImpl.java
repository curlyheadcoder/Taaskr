package com.taaskr.service.impl;

import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import com.taaskr.entity.Booking;
import com.taaskr.entity.User;
import com.taaskr.enums.Role;
import com.taaskr.exception.ResourceNotFoundException;
import com.taaskr.repository.BookingRepository;
import com.taaskr.repository.UserRepository;
import com.taaskr.service.InvoicePdfService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

@Service
@Transactional(readOnly = true)
public class InvoicePdfServiceImpl implements InvoicePdfService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;

    public InvoicePdfServiceImpl(BookingRepository bookingRepository, UserRepository userRepository) {
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
    }

    @Override
    public byte[] generateInvoicePdf(Long bookingId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        boolean isCustomer = booking.getUser().getId().equals(user.getId());
        boolean isAssignedProvider = booking.getProvider() != null && booking.getProvider().getUser().getId().equals(user.getId());
        boolean isAdmin = user.getRole() == Role.ADMIN;

        if (!isCustomer && !isAssignedProvider && !isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to invoice for booking #" + bookingId);
        }

        return createPdfDocument(booking);
    }

    @Override
    public byte[] generateAdminInvoicePdf(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        return createPdfDocument(booking);
    }

    private byte[] createPdfDocument(Booking booking) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 40, 40);
            PdfWriter.getInstance(document, out);
            document.open();

            // Palette
            Color primaryColor = new Color(79, 70, 229); // #4F46E5 Indigo
            Color darkTextColor = new Color(30, 41, 59); // Slate-800
            Color mutedTextColor = new Color(100, 116, 139); // Slate-500
            Color lightBgColor = new Color(248, 250, 252); // Slate-50
            Color borderColor = new Color(226, 232, 240); // Slate-200

            Font brandFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22, primaryColor);
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, darkTextColor);
            Font subHeaderFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, darkTextColor);
            Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 10, darkTextColor);
            Font bodyBoldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, darkTextColor);
            Font mutedFont = FontFactory.getFont(FontFactory.HELVETICA, 9, mutedTextColor);
            Font smallFont = FontFactory.getFont(FontFactory.HELVETICA, 8, mutedTextColor);

            // Header Section
            PdfPTable headerTable = new PdfPTable(2);
            headerTable.setWidthPercentage(100);
            headerTable.setWidths(new float[]{60f, 40f});

            // Brand / Title Cell
            PdfPCell brandCell = new PdfPCell();
            brandCell.setBorder(Rectangle.NO_BORDER);
            brandCell.addElement(new Paragraph("TAASKR", brandFont));
            brandCell.addElement(new Paragraph("On-Demand Local Services & Logistics", mutedFont));
            brandCell.addElement(new Paragraph("support@taaskr.com | https://taaskr.app", smallFont));
            headerTable.addCell(brandCell);

            // Invoice Meta Cell
            PdfPCell metaCell = new PdfPCell();
            metaCell.setBorder(Rectangle.NO_BORDER);
            metaCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            Paragraph invTitle = new Paragraph("TAX INVOICE / RECEIPT", titleFont);
            invTitle.setAlignment(Element.ALIGN_RIGHT);
            metaCell.addElement(invTitle);

            Paragraph invNo = new Paragraph("Invoice No: INV-" + booking.getBookingCode(), bodyBoldFont);
            invNo.setAlignment(Element.ALIGN_RIGHT);
            metaCell.addElement(invNo);

            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd MMM yyyy");
            String dateStr = booking.getCreatedAt() != null ? booking.getCreatedAt().format(dtf) : "N/A";
            Paragraph invDate = new Paragraph("Issued Date: " + dateStr, mutedFont);
            invDate.setAlignment(Element.ALIGN_RIGHT);
            metaCell.addElement(invDate);

            headerTable.addCell(metaCell);
            document.add(headerTable);

            // Divider Line
            document.add(new Paragraph(" "));
            PdfPTable divTable = new PdfPTable(1);
            divTable.setWidthPercentage(100);
            PdfPCell divCell = new PdfPCell();
            divCell.setBorder(Rectangle.BOTTOM);
            divCell.setBorderColor(primaryColor);
            divCell.setBorderWidth(2f);
            divCell.setFixedHeight(2f);
            divTable.addCell(divCell);
            document.add(divTable);
            document.add(new Paragraph(" "));

            // Customer & Provider Info Box
            PdfPTable infoTable = new PdfPTable(2);
            infoTable.setWidthPercentage(100);
            infoTable.setWidths(new float[]{50f, 50f});

            // Customer Details Cell
            PdfPCell custCell = new PdfPCell();
            custCell.setBackgroundColor(lightBgColor);
            custCell.setBorderColor(borderColor);
            custCell.setPadding(10f);
            custCell.addElement(new Paragraph("BILLED TO (CUSTOMER)", subHeaderFont));
            custCell.addElement(new Paragraph("Name: " + booking.getUser().getName(), bodyBoldFont));
            custCell.addElement(new Paragraph("Email: " + booking.getUser().getEmail(), bodyFont));
            custCell.addElement(new Paragraph("Phone: " + booking.getUser().getPhone(), bodyFont));
            custCell.addElement(new Paragraph("Service Address: " + booking.getAddress() + ", " + booking.getCity() + " - " + booking.getPincode(), bodyFont));
            if (booking.getDropAddress() != null && !booking.getDropAddress().isBlank()) {
                custCell.addElement(new Paragraph("Drop Location: " + booking.getDropAddress() + ", " + booking.getDropCity() + " - " + booking.getDropPincode(), bodyFont));
            }
            infoTable.addCell(custCell);

            // Service & Provider Details Cell
            PdfPCell provCell = new PdfPCell();
            provCell.setBackgroundColor(lightBgColor);
            provCell.setBorderColor(borderColor);
            provCell.setPadding(10f);
            provCell.addElement(new Paragraph("SERVICE & FULFILLMENT", subHeaderFont));
            provCell.addElement(new Paragraph("Service: " + booking.getService().getName(), bodyBoldFont));
            if (booking.getService().getCategory() != null) {
                provCell.addElement(new Paragraph("Category: " + booking.getService().getCategory().getName(), bodyFont));
            }
            if (booking.getProvider() != null && booking.getProvider().getUser() != null) {
                provCell.addElement(new Paragraph("Fulfillment Partner: " + booking.getProvider().getUser().getName(), bodyFont));
                provCell.addElement(new Paragraph("Partner Phone: " + booking.getProvider().getUser().getPhone(), bodyFont));
            } else {
                provCell.addElement(new Paragraph("Fulfillment Partner: Taaskr Fleet Dispatch", bodyFont));
            }
            if (booking.getVehicle() != null) {
                provCell.addElement(new Paragraph("Assigned Vehicle: " + booking.getVehicle().getVehicleType() + " (" + booking.getVehicle().getRegistrationNumber() + ")", bodyFont));
            }
            provCell.addElement(new Paragraph("Scheduled: " + booking.getBookingDate() + " @ " + booking.getStartTime(), bodyFont));
            infoTable.addCell(provCell);

            document.add(infoTable);
            document.add(new Paragraph(" "));

            // Items Table
            PdfPTable itemsTable = new PdfPTable(4);
            itemsTable.setWidthPercentage(100);
            itemsTable.setWidths(new float[]{45f, 15f, 20f, 20f});

            // Table Headers
            String[] headers = {"Item Description", "Qty / Duration", "Unit Price", "Total (INR)"};
            for (String h : headers) {
                PdfPCell hCell = new PdfPCell(new Phrase(h, subHeaderFont));
                hCell.setBackgroundColor(new Color(241, 245, 249));
                hCell.setBorderColor(borderColor);
                hCell.setPadding(8f);
                if (h.contains("Price") || h.contains("Total")) {
                    hCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                }
                itemsTable.addCell(hCell);
            }

            // Item Row
            String itemDesc = booking.getService().getName();
            if (booking.getDistanceKm() != null) {
                itemDesc += " (" + booking.getDistanceKm() + " km trip)";
            }
            PdfPCell descCell = new PdfPCell(new Phrase(itemDesc, bodyFont));
            descCell.setBorderColor(borderColor);
            descCell.setPadding(8f);
            itemsTable.addCell(descCell);

            String durationStr = booking.getService().getDurationMinutes() != null ? booking.getService().getDurationMinutes() + " mins" : "1 Unit";
            PdfPCell qtyCell = new PdfPCell(new Phrase(durationStr, bodyFont));
            qtyCell.setBorderColor(borderColor);
            qtyCell.setPadding(8f);
            itemsTable.addCell(qtyCell);

            PdfPCell priceCell = new PdfPCell(new Phrase("Rs. " + booking.getTotalAmount(), bodyFont));
            priceCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            priceCell.setBorderColor(borderColor);
            priceCell.setPadding(8f);
            itemsTable.addCell(priceCell);

            PdfPCell totalCell = new PdfPCell(new Phrase("Rs. " + booking.getTotalAmount(), bodyBoldFont));
            totalCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            totalCell.setBorderColor(borderColor);
            totalCell.setPadding(8f);
            itemsTable.addCell(totalCell);

            document.add(itemsTable);

            // Summary Breakdown Table
            PdfPTable summaryTable = new PdfPTable(2);
            summaryTable.setWidthPercentage(45);
            summaryTable.setHorizontalAlignment(Element.ALIGN_RIGHT);
            summaryTable.setWidths(new float[]{60f, 40f});

            addSummaryRow(summaryTable, "Subtotal:", "Rs. " + booking.getTotalAmount(), bodyFont, borderColor);
            if (booking.getDiscountAmount() != null && booking.getDiscountAmount().compareTo(java.math.BigDecimal.ZERO) > 0) {
                addSummaryRow(summaryTable, "Discount:", "- Rs. " + booking.getDiscountAmount(), bodyFont, borderColor);
            }
            addSummaryRow(summaryTable, "Taxes & Platform GST:", "Inclusive", mutedFont, borderColor);

            // Grand Total Row
            PdfPCell grandLabelCell = new PdfPCell(new Phrase("Grand Total:", titleFont));
            grandLabelCell.setBackgroundColor(lightBgColor);
            grandLabelCell.setBorderColor(borderColor);
            grandLabelCell.setPadding(8f);
            summaryTable.addCell(grandLabelCell);

            PdfPCell grandValCell = new PdfPCell(new Phrase("Rs. " + booking.getFinalAmount(), titleFont));
            grandValCell.setBackgroundColor(lightBgColor);
            grandValCell.setBorderColor(borderColor);
            grandValCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            grandValCell.setPadding(8f);
            summaryTable.addCell(grandValCell);

            document.add(summaryTable);
            document.add(new Paragraph(" "));

            // Payment & Status Badge Box
            PdfPTable statusTable = new PdfPTable(3);
            statusTable.setWidthPercentage(100);
            statusTable.setWidths(new float[]{33f, 33f, 34f});

            PdfPCell paymentMethodCell = new PdfPCell();
            paymentMethodCell.setBackgroundColor(lightBgColor);
            paymentMethodCell.setBorderColor(borderColor);
            paymentMethodCell.setPadding(8f);
            paymentMethodCell.addElement(new Paragraph("Payment Method", mutedFont));
            paymentMethodCell.addElement(new Paragraph(booking.getPaymentMethod() != null ? booking.getPaymentMethod().name() : "ONLINE", bodyBoldFont));
            statusTable.addCell(paymentMethodCell);

            PdfPCell paymentStatusCell = new PdfPCell();
            paymentStatusCell.setBackgroundColor(lightBgColor);
            paymentStatusCell.setBorderColor(borderColor);
            paymentStatusCell.setPadding(8f);
            paymentStatusCell.addElement(new Paragraph("Payment Status", mutedFont));
            Paragraph pStatus = new Paragraph(booking.getPaymentStatus() != null ? booking.getPaymentStatus().name() : "PENDING", bodyBoldFont);
            paymentStatusCell.addElement(pStatus);
            statusTable.addCell(paymentStatusCell);

            PdfPCell bookingStatusCell = new PdfPCell();
            bookingStatusCell.setBackgroundColor(lightBgColor);
            bookingStatusCell.setBorderColor(borderColor);
            bookingStatusCell.setPadding(8f);
            bookingStatusCell.addElement(new Paragraph("Job Fulfillment Status", mutedFont));
            Paragraph bStatus = new Paragraph(booking.getStatus() != null ? booking.getStatus().name() : "PENDING", bodyBoldFont);
            bookingStatusCell.addElement(bStatus);
            statusTable.addCell(bookingStatusCell);

            document.add(statusTable);
            document.add(new Paragraph(" "));

            // Terms & Footer Note
            Paragraph footer = new Paragraph("Thank you for choosing Taaskr! This is a computer-generated tax invoice. For queries or dispute arbitration, please contact support@taaskr.com.", smallFont);
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            document.close();
            return out.toByteArray();
        } catch (Exception ex) {
            throw new RuntimeException("Failed to generate PDF invoice: " + ex.getMessage(), ex);
        }
    }

    private void addSummaryRow(PdfPTable table, String label, String value, Font font, Color borderColor) {
        PdfPCell lCell = new PdfPCell(new Phrase(label, font));
        lCell.setBorderColor(borderColor);
        lCell.setPadding(6f);
        table.addCell(lCell);

        PdfPCell vCell = new PdfPCell(new Phrase(value, font));
        vCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        vCell.setBorderColor(borderColor);
        vCell.setPadding(6f);
        table.addCell(vCell);
    }
}
