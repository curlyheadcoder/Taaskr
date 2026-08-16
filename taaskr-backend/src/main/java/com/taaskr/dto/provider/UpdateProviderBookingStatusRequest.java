package com.taaskr.dto.provider;

import com.taaskr.enums.BookingStatus;
import jakarta.validation.constraints.NotNull;

public class UpdateProviderBookingStatusRequest {

    @NotNull(message = "Status is required")
    private BookingStatus status;

    public BookingStatus getStatus() {
        return status;
    }

    public void setStatus(BookingStatus status) {
        this.status = status;
    }
}