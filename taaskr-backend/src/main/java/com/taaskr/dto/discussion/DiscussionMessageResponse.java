package com.taaskr.dto.discussion;

import java.time.LocalDateTime;

public class DiscussionMessageResponse {
    private Long id;
    private String senderRole;
    private String senderName;
    private String message;
    private LocalDateTime createdAt;

    public DiscussionMessageResponse() {
    }

    public DiscussionMessageResponse(Long id, String senderRole, String senderName, String message, LocalDateTime createdAt) {
        this.id = id;
        this.senderRole = senderRole;
        this.senderName = senderName;
        this.message = message;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getSenderRole() {
        return senderRole;
    }

    public void setSenderRole(String senderRole) {
        this.senderRole = senderRole;
    }

    public String getSenderName() {
        return senderName;
    }

    public void setSenderName(String senderName) {
        this.senderName = senderName;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
