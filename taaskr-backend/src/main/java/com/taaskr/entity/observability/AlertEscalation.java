package com.taaskr.entity.observability;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "alert_escalations",
        indexes = {
                @Index(name = "idx_escalation_incident", columnList = "incident_id")
        }
)
public class AlertEscalation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "incident_id", nullable = false)
    private MonitoringIncident incident;

    @Column(nullable = false)
    private Integer escalationLevel = 1;

    @Column(nullable = false)
    private Integer delayMinutes = 5;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NotificationChannelType channelType = NotificationChannelType.EMAIL;

    @Column(length = 255)
    private String recipient;

    @Column(nullable = false, length = 20)
    private String status = "SENT"; // SENT, FAILED, SKIPPED

    @Column(nullable = false, updatable = false)
    private LocalDateTime triggeredAt = LocalDateTime.now();

    public AlertEscalation() {}

    public AlertEscalation(MonitoringIncident incident, Integer escalationLevel, NotificationChannelType channelType, String recipient, String status) {
        this.incident = incident;
        this.escalationLevel = escalationLevel;
        this.channelType = channelType;
        this.recipient = recipient;
        this.status = status;
        this.triggeredAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public MonitoringIncident getIncident() { return incident; }
    public Integer getEscalationLevel() { return escalationLevel; }
    public Integer getDelayMinutes() { return delayMinutes; }
    public NotificationChannelType getChannelType() { return channelType; }
    public String getRecipient() { return recipient; }
    public String getStatus() { return status; }
    public LocalDateTime getTriggeredAt() { return triggeredAt; }

    public void setId(Long id) { this.id = id; }
    public void setIncident(MonitoringIncident incident) { this.incident = incident; }
    public void setEscalationLevel(Integer escalationLevel) { this.escalationLevel = escalationLevel; }
    public void setDelayMinutes(Integer delayMinutes) { this.delayMinutes = delayMinutes; }
    public void setChannelType(NotificationChannelType channelType) { this.channelType = channelType; }
    public void setRecipient(String recipient) { this.recipient = recipient; }
    public void setStatus(String status) { this.status = status; }
    public void setTriggeredAt(LocalDateTime triggeredAt) { this.triggeredAt = triggeredAt; }
}
