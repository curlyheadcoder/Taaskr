package com.taaskr.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "discussion_messages")
public class DiscussionMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "discussion_id", nullable = false)
    private PartnerDiscussion discussion;

    @Column(nullable = false, length = 30)
    private String senderRole; // "PROVIDER" or "ADMIN"

    @Column(nullable = false, length = 120)
    private String senderName;

    @Column(nullable = false, length = 2000)
    private String message;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public DiscussionMessage() {
    }

    public DiscussionMessage(PartnerDiscussion discussion, String senderRole, String senderName, String message) {
        this.discussion = discussion;
        this.senderRole = senderRole;
        this.senderName = senderName;
        this.message = message;
    }

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public PartnerDiscussion getDiscussion() {
        return discussion;
    }

    public void setDiscussion(PartnerDiscussion discussion) {
        this.discussion = discussion;
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
}
