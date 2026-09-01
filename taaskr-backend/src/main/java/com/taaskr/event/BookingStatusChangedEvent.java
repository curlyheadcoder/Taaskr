package com.taaskr.event;

import com.taaskr.enums.BookingStatus;

public class BookingStatusChangedEvent {

    private final Long bookingId;
    private final BookingStatus oldStatus;
    private final BookingStatus newStatus;
    private final Long providerId;

    public BookingStatusChangedEvent(Long bookingId, BookingStatus oldStatus, BookingStatus newStatus, Long providerId) {
        this.bookingId = bookingId;
        this.oldStatus = oldStatus;
        this.newStatus = newStatus;
        this.providerId = providerId;
    }

    public Long getBookingId() {
        return bookingId;
    }

    public BookingStatus getOldStatus() {
        return oldStatus;
    }

    public BookingStatus getNewStatus() {
        return newStatus;
    }

    public Long getProviderId() {
        return providerId;
    }
}
