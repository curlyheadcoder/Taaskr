package com.taaskr.entity;

import com.taaskr.enums.PushDeliveryStatus;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "push_notification_deliveries",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_push_delivery_notif_token",
                        columnNames = {"notification_id", "device_push_token_id"}
                )
        },
        indexes = {
                @Index(name = "idx_push_delivery_status_next", columnList = "status, next_attempt_at"),
                @Index(name = "idx_push_delivery_notif", columnList = "notification_id")
        }
)
public class PushNotificationDelivery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "notification_id", nullable = false)
    private Notification notification;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "device_push_token_id", nullable = false)
    private DevicePushToken devicePushToken;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PushDeliveryStatus status = PushDeliveryStatus.PENDING;

    @Column(name = "attempt_count", nullable = false)
    private Integer attemptCount = 0;

    @Column(name = "max_attempts", nullable = false)
    private Integer maxAttempts = 4;

    @Column(nullable = false, length = 30)
    private String provider = "EXPO";

    @Column(name = "provider_ticket_id", length = 120)
    private String providerTicketId;

    @Column(name = "last_attempt_at")
    private LocalDateTime lastAttemptAt;

    @Column(name = "next_attempt_at")
    private LocalDateTime nextAttemptAt;

    @Column(name = "failure_reason", length = 500)
    private String failureReason;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public PushNotificationDelivery() {
    }

    public PushNotificationDelivery(Notification notification, DevicePushToken devicePushToken) {
        this.notification = notification;
        this.devicePushToken = devicePushToken;
        this.status = PushDeliveryStatus.PENDING;
        this.attemptCount = 0;
        this.maxAttempts = 4;
        this.provider = "EXPO";
        this.nextAttemptAt = LocalDateTime.now();
    }

    @PrePersist
    public void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.nextAttemptAt == null) {
            this.nextAttemptAt = now;
        }
        if (this.attemptCount == null) {
            this.attemptCount = 0;
        }
        if (this.maxAttempts == null) {
            this.maxAttempts = 4;
        }
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

    public Notification getNotification() {
        return notification;
    }

    public void setNotification(Notification notification) {
        this.notification = notification;
    }

    public DevicePushToken getDevicePushToken() {
        return devicePushToken;
    }

    public void setDevicePushToken(DevicePushToken devicePushToken) {
        this.devicePushToken = devicePushToken;
    }

    public PushDeliveryStatus getStatus() {
        return status;
    }

    public void setStatus(PushDeliveryStatus status) {
        this.status = status;
    }

    public Integer getAttemptCount() {
        return attemptCount;
    }

    public void setAttemptCount(Integer attemptCount) {
        this.attemptCount = attemptCount;
    }

    public Integer getMaxAttempts() {
        return maxAttempts;
    }

    public void setMaxAttempts(Integer maxAttempts) {
        this.maxAttempts = maxAttempts;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getProviderTicketId() {
        return providerTicketId;
    }

    public void setProviderTicketId(String providerTicketId) {
        this.providerTicketId = providerTicketId;
    }

    public LocalDateTime getLastAttemptAt() {
        return lastAttemptAt;
    }

    public void setLastAttemptAt(LocalDateTime lastAttemptAt) {
        this.lastAttemptAt = lastAttemptAt;
    }

    public LocalDateTime getNextAttemptAt() {
        return nextAttemptAt;
    }

    public void setNextAttemptAt(LocalDateTime nextAttemptAt) {
        this.nextAttemptAt = nextAttemptAt;
    }

    public String getFailureReason() {
        return failureReason;
    }

    public void setFailureReason(String failureReason) {
        this.failureReason = failureReason;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
