package com.taaskr.dto.dispute;

import com.taaskr.enums.DisputeStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class DisputeResponse {

    private Long id;
    private Long bookingId;
    private String bookingCode;
    private String serviceName;
    private BigDecimal bookingAmount;
    private Long userId;
    private String userName;
    private String userEmail;
    private String userPhone;
    private String customerName;
    private String customerEmail;
    private String customerPhone;
    private Long providerId;
    private String providerName;
    private String providerEmail;
    private String providerPhone;
    private String reason;
    private String description;
    private DisputeStatus status;
    private String resolution;
    private BigDecimal refundAmount;
    private String resolvedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public DisputeResponse() {
    }

    public static DisputeResponse fromEntity(com.taaskr.entity.Dispute d) {
        DisputeResponse res = new DisputeResponse();
        res.setId(d.getId());

        if (d.getBooking() != null) {
            res.setBookingId(d.getBooking().getId());
            res.setBookingCode(d.getBooking().getBookingCode());
            res.setBookingAmount(d.getBooking().getFinalAmount() != null ? d.getBooking().getFinalAmount() : d.getBooking().getTotalAmount());
            if (d.getBooking().getService() != null) {
                res.setServiceName(d.getBooking().getService().getName());
            }
        }

        // Customer Details Resolution (Primary user or fallback to booking user)
        com.taaskr.entity.User custUser = d.getUser();
        if (custUser == null && d.getBooking() != null) {
            custUser = d.getBooking().getUser();
        }

        if (custUser != null) {
            res.setUserId(custUser.getId());
            res.setUserName(custUser.getName());
            res.setUserEmail(custUser.getEmail());
            res.setUserPhone(custUser.getPhone());
            res.setCustomerName(custUser.getName());
            res.setCustomerEmail(custUser.getEmail());
            res.setCustomerPhone(custUser.getPhone());
        }

        // Provider Details Resolution (Primary provider or fallback to booking provider)
        com.taaskr.entity.ProviderProfile provProfile = d.getProvider();
        if (provProfile == null && d.getBooking() != null) {
            provProfile = d.getBooking().getProvider();
        }

        if (provProfile != null) {
            res.setProviderId(provProfile.getId());
            if (provProfile.getUser() != null) {
                res.setProviderName(provProfile.getUser().getName());
                res.setProviderEmail(provProfile.getUser().getEmail());
                res.setProviderPhone(provProfile.getUser().getPhone());
            }
        }

        res.setReason(d.getReason());
        res.setDescription(d.getDescription());
        res.setStatus(d.getStatus());
        res.setResolution(d.getResolution());
        res.setRefundAmount(d.getRefundAmount());
        res.setResolvedBy(d.getResolvedBy());
        res.setCreatedAt(d.getCreatedAt());
        res.setUpdatedAt(d.getUpdatedAt());

        return res;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getBookingId() {
        return bookingId;
    }

    public void setBookingId(Long bookingId) {
        this.bookingId = bookingId;
    }

    public String getBookingCode() {
        return bookingCode;
    }

    public void setBookingCode(String bookingCode) {
        this.bookingCode = bookingCode;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public Long getProviderId() {
        return providerId;
    }

    public void setProviderId(Long providerId) {
        this.providerId = providerId;
    }

    public String getProviderName() {
        return providerName;
    }

    public void setProviderName(String providerName) {
        this.providerName = providerName;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public DisputeStatus getStatus() {
        return status;
    }

    public void setStatus(DisputeStatus status) {
        this.status = status;
    }

    public String getResolution() {
        return resolution;
    }

    public void setResolution(String resolution) {
        this.resolution = resolution;
    }

    public BigDecimal getRefundAmount() {
        return refundAmount;
    }

    public void setRefundAmount(BigDecimal refundAmount) {
        this.refundAmount = refundAmount;
    }

    public String getResolvedBy() {
        return resolvedBy;
    }

    public void setResolvedBy(String resolvedBy) {
        this.resolvedBy = resolvedBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getServiceName() {
        return serviceName;
    }

    public void setServiceName(String serviceName) {
        this.serviceName = serviceName;
    }

    public BigDecimal getBookingAmount() {
        return bookingAmount;
    }

    public void setBookingAmount(BigDecimal bookingAmount) {
        this.bookingAmount = bookingAmount;
    }

    public String getUserPhone() {
        return userPhone;
    }

    public void setUserPhone(String userPhone) {
        this.userPhone = userPhone;
    }

    public String getCustomerName() {
        return customerName != null ? customerName : userName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getCustomerEmail() {
        return customerEmail != null ? customerEmail : userEmail;
    }

    public void setCustomerEmail(String customerEmail) {
        this.customerEmail = customerEmail;
    }

    public String getCustomerPhone() {
        return customerPhone != null ? customerPhone : userPhone;
    }

    public void setCustomerPhone(String customerPhone) {
        this.customerPhone = customerPhone;
    }

    public String getProviderEmail() {
        return providerEmail;
    }

    public void setProviderEmail(String providerEmail) {
        this.providerEmail = providerEmail;
    }

    public String getProviderPhone() {
        return providerPhone;
    }

    public void setProviderPhone(String providerPhone) {
        this.providerPhone = providerPhone;
    }
}
