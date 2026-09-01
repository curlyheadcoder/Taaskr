package com.taaskr.event;

public class BookingCreatedEvent {

    private final Long bookingId;
    private final Long customerId;
    private final String customerEmail;
    private final Long serviceId;
    private final String serviceName;

    public BookingCreatedEvent(Long bookingId, Long customerId, String customerEmail, Long serviceId, String serviceName) {
        this.bookingId = bookingId;
        this.customerId = customerId;
        this.customerEmail = customerEmail;
        this.serviceId = serviceId;
        this.serviceName = serviceName;
    }

    public Long getBookingId() {
        return bookingId;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public String getCustomerEmail() {
        return customerEmail;
    }

    public Long getServiceId() {
        return serviceId;
    }

    public String getServiceName() {
        return serviceName;
    }
}
