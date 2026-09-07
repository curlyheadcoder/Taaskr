package com.taaskr.entity;

import com.taaskr.enums.DiscussionCategory;
import com.taaskr.enums.DiscussionPriority;
import com.taaskr.enums.DiscussionStatus;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "partner_discussions")
public class PartnerDiscussion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "provider_id", nullable = false)
    private ProviderProfile provider;

    @Column(nullable = false, length = 180)
    private String subject;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private DiscussionCategory category = DiscussionCategory.GENERAL_INQUIRY;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private DiscussionPriority priority = DiscussionPriority.NORMAL;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private DiscussionStatus status = DiscussionStatus.OPEN;

    @Column(name = "booking_id")
    private Long bookingId;

    @OneToMany(mappedBy = "discussion", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    private List<DiscussionMessage> messages = new ArrayList<>();

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public PartnerDiscussion() {
    }

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.status == null) this.status = DiscussionStatus.OPEN;
        if (this.priority == null) this.priority = DiscussionPriority.NORMAL;
        if (this.category == null) this.category = DiscussionCategory.GENERAL_INQUIRY;
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public ProviderProfile getProvider() {
        return provider;
    }

    public void setProvider(ProviderProfile provider) {
        this.provider = provider;
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

    public List<DiscussionMessage> getMessages() {
        return messages;
    }

    public void setMessages(List<DiscussionMessage> messages) {
        this.messages = messages;
    }

    public void addMessage(DiscussionMessage message) {
        this.messages.add(message);
        message.setDiscussion(this);
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
