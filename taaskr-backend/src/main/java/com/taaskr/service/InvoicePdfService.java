package com.taaskr.service;

public interface InvoicePdfService {
    byte[] generateInvoicePdf(Long bookingId, String userEmail);
    byte[] generateAdminInvoicePdf(Long bookingId);
}
