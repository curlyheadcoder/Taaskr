package com.taaskr.service;

import com.taaskr.dto.booking.BookingResponse;
import com.taaskr.dto.partner.*;
import com.taaskr.enums.PaymentMethod;

import java.util.List;

public interface ServicePartnerService {

    // Provider operations
    ServicePartnerResponse createServicePartner(String providerEmail, CreateServicePartnerRequest request);

    List<ServicePartnerResponse> getProviderPartners(String providerEmail);

    ServicePartnerResponse togglePartnerStatus(String providerEmail, Long partnerId, Boolean active);

    BookingResponse assignPartnerToTask(String providerEmail, Long bookingId, Long partnerId);

    BookingResponse reassignPartnerToTask(String providerEmail, Long bookingId, Long partnerId);

    BookingResponse approveCompletionByProvider(String providerEmail, Long bookingId);

    // Partner worker operations
    List<BookingResponse> getPartnerAssignedTasks(String partnerEmail);

    BookingResponse acceptTaskByPartner(String partnerEmail, Long bookingId);

    BookingResponse startJourneyByPartner(String partnerEmail, Long bookingId);

    void updatePartnerLocation(String partnerEmail, UpdatePartnerLocationRequest request);

    BookingResponse markArrivedByPartner(String partnerEmail, Long bookingId);

    BookingResponse startWorkByPartner(String partnerEmail, Long bookingId);

    BookingResponse completeWorkByPartner(String partnerEmail, Long bookingId);

    BookingResponse recordPaymentByPartner(String partnerEmail, Long bookingId, PaymentMethod method);
}
