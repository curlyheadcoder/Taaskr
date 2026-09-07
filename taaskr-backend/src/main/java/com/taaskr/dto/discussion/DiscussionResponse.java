package com.taaskr.dto.discussion;

import com.taaskr.enums.DiscussionCategory;
import com.taaskr.enums.DiscussionPriority;
import com.taaskr.enums.DiscussionStatus;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class DiscussionResponse {
    private Long id;
    private Long providerId;
    private String providerName;
    private String providerEmail;
    private String providerPhone;
    private String providerCity;
    private String subject;
    private DiscussionCategory category;
    private DiscussionPriority priority;
    private DiscussionStatus status;
    private Long bookingId;
    private List<DiscussionMessageResponse> messages = new ArrayList<>();
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public DiscussionResponse() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public String getProviderCity() {
        return providerCity;
    }

    public void setProviderCity(String providerCity) {
        this.providerCity = providerCity;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public DiscussionCategory getCategory() {
        return category;
    }

    public void setCategory(DiscussionCategory category) {
        this.category = category;
    }

    public DiscussionPriority getPriority() {
        return priority;
    }

    public void setPriority(DiscussionPriority priority) {
        this.priority = priority;
    }

    public DiscussionStatus getStatus() {
        return status;
    }

    public void setStatus(DiscussionStatus status) {
        this.status = status;
    }

    public Long getBookingId() {
        return bookingId;
    }

    public void setBookingId(Long bookingId) {
        this.bookingId = bookingId;
    }

    public List<DiscussionMessageResponse> getMessages() {
        return messages;
    }

    public void setMessages(List<DiscussionMessageResponse> messages) {
        this.messages = messages;
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
