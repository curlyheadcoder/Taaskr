package com.taaskr.entity.observability;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "monitoring_incidents",
        indexes = {
                @Index(name = "idx_incident_status", columnList = "status"),
                @Index(name = "idx_incident_endpoint", columnList = "endpoint_id")
        }
)
public class MonitoringIncident {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "endpoint_id", nullable = false)
    private MonitoredEndpoint endpoint;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private IncidentStatus status = IncidentStatus.OPEN;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private IncidentSeverity severity = IncidentSeverity.HIGH;

    @Column(nullable = false)
    private LocalDateTime startedAt = LocalDateTime.now();

    private LocalDateTime lastObservedFailure;

    private LocalDateTime resolvedAt;

    private Integer currentStatusCode;

    @Column(length = 500)
    private String failureReason;

    private Integer failedCheckCount = 1;

    private Integer escalationLevel = 1;

    @Column(length = 100)
    private String acknowledgedBy;

    private LocalDateTime acknowledgedAt;

    public MonitoringIncident() {}

    public MonitoringIncident(MonitoredEndpoint endpoint, IncidentSeverity severity, String failureReason, Integer statusCode) {
        this.endpoint = endpoint;
        this.severity = severity;
        this.failureReason = failureReason;
        this.currentStatusCode = statusCode;
        this.startedAt = LocalDateTime.now();
        this.lastObservedFailure = LocalDateTime.now();
        this.status = IncidentStatus.OPEN;
    }

    public Long getId() { return id; }
    public MonitoredEndpoint getEndpoint() { return endpoint; }
    public IncidentStatus getStatus() { return status; }
    public IncidentSeverity getSeverity() { return severity; }
    public LocalDateTime getStartedAt() { return startedAt; }
    public LocalDateTime getLastObservedFailure() { return lastObservedFailure; }
    public LocalDateTime getResolvedAt() { return resolvedAt; }
    public Integer getCurrentStatusCode() { return currentStatusCode; }
    public String getFailureReason() { return failureReason; }
    public Integer getFailedCheckCount() { return failedCheckCount; }
    public Integer getEscalationLevel() { return escalationLevel; }
    public String getAcknowledgedBy() { return acknowledgedBy; }
    public LocalDateTime getAcknowledgedAt() { return acknowledgedAt; }

    public void setId(Long id) { this.id = id; }
    public void setEndpoint(MonitoredEndpoint endpoint) { this.endpoint = endpoint; }
    public void setStatus(IncidentStatus status) { this.status = status; }
    public void setSeverity(IncidentSeverity severity) { this.severity = severity; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }
    public void setLastObservedFailure(LocalDateTime lastObservedFailure) { this.lastObservedFailure = lastObservedFailure; }
    public void setResolvedAt(LocalDateTime resolvedAt) { this.resolvedAt = resolvedAt; }
    public void setCurrentStatusCode(Integer currentStatusCode) { this.currentStatusCode = currentStatusCode; }
    public void setFailureReason(String failureReason) { this.failureReason = failureReason; }
    public void setFailedCheckCount(Integer failedCheckCount) { this.failedCheckCount = failedCheckCount; }
    public void setEscalationLevel(Integer escalationLevel) { this.escalationLevel = escalationLevel; }
    public void setAcknowledgedBy(String acknowledgedBy) { this.acknowledgedBy = acknowledgedBy; }
    public void setAcknowledgedAt(LocalDateTime acknowledgedAt) { this.acknowledgedAt = acknowledgedAt; }
}
