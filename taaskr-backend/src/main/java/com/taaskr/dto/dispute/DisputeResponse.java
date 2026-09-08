package com.taaskr.dto.dispute;

import com.taaskr.enums.DisputeStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class DisputeResponse {

    private Long id;
    private Long bookingId;
    private String bookingCode;
    private Long userId;
    private String userName;
    private String userEmail;
    private Long providerId;
    private String providerName;
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

    public DisputeResponse(Long id, Long bookingId, String bookingCode, Long userId, String userName, String userEmail, Long providerId, String providerName, String reason, String description, DisputeStatus status, String resolution, BigDecimal refundAmount, String resolvedBy, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.bookingId = bookingId;
        this.bookingCode = bookingCode;
        this.userId = userId;
        this.userName = userName;
        this.userEmail = userEmail;
        this.providerId = providerId;
        this.providerName = providerName;
        this.reason = reason;
        this.description = description;
        this.status = status;
        this.resolution = resolution;
        this.refundAmount = refundAmount;
        this.resolvedBy = resolvedBy;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static DisputeResponse fromEntity(com.taaskr.entity.Dispute d) {
        return new DisputeResponse(
                d.getId(),
                d.getBooking() != null ? d.getBooking().getId() : null,
                d.getBooking() != null ? d.getBooking().getBookingCode() : null,
                d.getUser() != null ? d.getUser().getId() : null,
                d.getUser() != null ? d.getUser().getName() : null,
                d.getUser() != null ? d.getUser().getEmail() : null,
                d.getProvider() != null ? d.getProvider().getId() : null,
                (d.getProvider() != null && d.getProvider().getUser() != null) ? d.getProvider().getUser().getName() : null,
                d.getReason(),
                d.getDescription(),
                d.getStatus(),
                d.getResolution(),
                d.getRefundAmount(),
                d.getResolvedBy(),
                d.getCreatedAt(),
                d.getUpdatedAt()
        );
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
}
