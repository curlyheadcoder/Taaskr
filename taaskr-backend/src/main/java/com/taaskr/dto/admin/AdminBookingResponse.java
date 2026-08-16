package com.taaskr.dto.admin;

import com.taaskr.enums.BookingStatus;
import com.taaskr.enums.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public class AdminBookingResponse {

    private Long id;
    private String bookingCode;

    private Long userId;
    private String userName;
    private String userPhone;

    private Long providerId;
    private String providerName;

    private Long serviceId;
    private String serviceName;
    private String categoryName;

    private LocalDate bookingDate;
    private LocalTime startTime;
    private LocalTime endTime;

    private String address;
    private String city;
    private String pincode;

    private BookingStatus status;

    private BigDecimal totalAmount;
    private BigDecimal discountAmount;
    private BigDecimal finalAmount;

    private PaymentStatus paymentStatus;

    private String notes;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public AdminBookingResponse() {
    }

    public AdminBookingResponse(
            Long id,
            String bookingCode,
            Long userId,
            String userName,
            String userPhone,
            Long providerId,
            String providerName,
            Long serviceId,
            String serviceName,
            String categoryName,
            LocalDate bookingDate,
            LocalTime startTime,
            LocalTime endTime,
            String address,
            String city,
            String pincode,
            BookingStatus status,
            BigDecimal totalAmount,
            BigDecimal discountAmount,
            BigDecimal finalAmount,
            PaymentStatus paymentStatus,
            String notes,
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {

        this.id = id;
        this.bookingCode = bookingCode;
        this.userId = userId;
        this.userName = userName;
        this.userPhone = userPhone;
        this.providerId = providerId;
        this.providerName = providerName;
        this.serviceId = serviceId;
        this.serviceName = serviceName;
        this.categoryName = categoryName;
        this.bookingDate = bookingDate;
        this.startTime = startTime;
        this.endTime = endTime;
        this.address = address;
        this.city = city;
        this.pincode = pincode;
        this.status = status;
        this.totalAmount = totalAmount;
        this.discountAmount = discountAmount;
        this.finalAmount = finalAmount;
        this.paymentStatus = paymentStatus;
        this.notes = notes;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public String getBookingCode() {
        return bookingCode;
    }

    public Long getUserId() {
        return userId;
    }

    public String getUserName() {
        return userName;
    }

    public String getUserPhone() {
        return userPhone;
    }

    public Long getProviderId() {
        return providerId;
    }

    public String getProviderName() {
        return providerName;
    }

    public Long getServiceId() {
        return serviceId;
    }

    public String getServiceName() {
        return serviceName;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public LocalDate getBookingDate() {
        return bookingDate;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public String getAddress() {
        return address;
    }

    public String getCity() {
        return city;
    }

    public String getPincode() {
        return pincode;
    }

    public BookingStatus getStatus() {
        return status;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public BigDecimal getDiscountAmount() {
        return discountAmount;
    }

    public BigDecimal getFinalAmount() {
        return finalAmount;
    }

    public PaymentStatus getPaymentStatus() {
        return paymentStatus;
    }

    public String getNotes() {
        return notes;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}