package com.taaskr.dto.review;

import java.time.LocalDateTime;

public class ReviewResponse {

    private Long id;
    private Long bookingId;
    private String bookingCode;
    private Long userId;
    private String userName;
    private Long providerId;
    private String providerName;
    private Long serviceId;
    private String serviceName;
    private Integer rating;
    private Integer qualityRating;
    private Integer punctualityRating;
    private String comment;
    private String providerReply;
    private LocalDateTime repliedAt;
    private LocalDateTime createdAt;

    public ReviewResponse() {
    }

    public ReviewResponse(Long id, Long bookingId, String bookingCode, Long userId, String userName, Long providerId, String providerName, Long serviceId, String serviceName, Integer rating, Integer qualityRating, Integer punctualityRating, String comment, String providerReply, LocalDateTime repliedAt, LocalDateTime createdAt) {
        this.id = id;
        this.bookingId = bookingId;
        this.bookingCode = bookingCode;
        this.userId = userId;
        this.userName = userName;
        this.providerId = providerId;
        this.providerName = providerName;
        this.serviceId = serviceId;
        this.serviceName = serviceName;
        this.rating = rating;
        this.qualityRating = qualityRating;
        this.punctualityRating = punctualityRating;
        this.comment = comment;
        this.providerReply = providerReply;
        this.repliedAt = repliedAt;
        this.createdAt = createdAt;
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

    public Long getServiceId() {
        return serviceId;
    }

    public void setServiceId(Long serviceId) {
        this.serviceId = serviceId;
    }

    public String getServiceName() {
        return serviceName;
    }

    public void setServiceName(String serviceName) {
        this.serviceName = serviceName;
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public Integer getQualityRating() {
        return qualityRating;
    }

    public void setQualityRating(Integer qualityRating) {
        this.qualityRating = qualityRating;
    }

    public Integer getPunctualityRating() {
        return punctualityRating;
    }

    public void setPunctualityRating(Integer punctualityRating) {
        this.punctualityRating = punctualityRating;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public String getProviderReply() {
        return providerReply;
    }

    public void setProviderReply(String providerReply) {
        this.providerReply = providerReply;
    }

    public LocalDateTime getRepliedAt() {
        return repliedAt;
    }

    public void setRepliedAt(LocalDateTime repliedAt) {
        this.repliedAt = repliedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
