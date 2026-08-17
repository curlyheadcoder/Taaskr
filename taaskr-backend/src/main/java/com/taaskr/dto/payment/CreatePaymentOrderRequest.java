package com.taaskr.dto.payment;

import jakarta.validation.constraints.NotNull;

public class CreatePaymentOrderRequest {
    @NotNull(message = "Booking ID is required")
    private Long bookingId;

    public CreatePaymentOrderRequest() {
    }

    public Long getBookingId() {
        return bookingId;
    }

    public void setBookingId(Long bookingId) {
        this.bookingId = bookingId;
    }
}
