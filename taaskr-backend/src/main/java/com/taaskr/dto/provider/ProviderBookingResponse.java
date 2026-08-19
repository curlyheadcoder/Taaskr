package com.taaskr.dto.provider;

import com.taaskr.enums.BookingStatus;
import com.taaskr.enums.PaymentMethod;
import com.taaskr.enums.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public class ProviderBookingResponse {

    private Long id;
    private String bookingCode;

    private Long serviceId;
    private String serviceName;
    private String categoryName;

    private Long userId;
    private String userName;
    private String userPhone;

    private LocalDate bookingDate;
    private LocalTime startTime;
    private LocalTime endTime;

    private String address;
    private String city;
    private String pincode;
    private BigDecimal latitude;
    private BigDecimal longitude;

    private BookingStatus status;
    private BigDecimal finalAmount;
    private PaymentStatus paymentStatus;
    private PaymentMethod paymentMethod;
    private String notes;

    private LocalDateTime createdAt;

    public ProviderBookingResponse() {
    }

    public ProviderBookingResponse(Long id, String bookingCode,
                                   Long serviceId, String serviceName, String categoryName,
                                   Long userId, String userName, String userPhone,
                                   LocalDate bookingDate, LocalTime startTime, LocalTime endTime,
                                   String address, String city, String pincode, BigDecimal latitude, BigDecimal longitude,
                                   BookingStatus status, BigDecimal finalAmount,
                                   PaymentStatus paymentStatus, PaymentMethod paymentMethod, String notes,
                                   LocalDateTime createdAt) {
        this.id = id;
        this.bookingCode = bookingCode;
        this.serviceId = serviceId;
        this.serviceName = serviceName;
        this.categoryName = categoryName;
        this.userId = userId;
        this.userName = userName;
        this.userPhone = userPhone;
        this.bookingDate = bookingDate;
        this.startTime = startTime;
        this.endTime = endTime;
        this.address = address;
        this.city = city;
        this.pincode = pincode;
        this.latitude = latitude;
        this.longitude = longitude;
        this.status = status;
        this.finalAmount = finalAmount;
        this.paymentStatus = paymentStatus;
        this.paymentMethod = paymentMethod;
        this.notes = notes;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public String getBookingCode() {
        return bookingCode;
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

    public Long getUserId() {
        return userId;
    }

    public String getUserName() {
        return userName;
    }

    public String getUserPhone() {
        return userPhone;
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

    public BigDecimal getLatitude() {
        return latitude;
    }

    public BigDecimal getLongitude() {
        return longitude;
    }

    public BookingStatus getStatus() {
        return status;
    }

    public BigDecimal getFinalAmount() {
        return finalAmount;
    }

    public PaymentStatus getPaymentStatus() {
        return paymentStatus;
    }

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public String getNotes() {
        return notes;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
