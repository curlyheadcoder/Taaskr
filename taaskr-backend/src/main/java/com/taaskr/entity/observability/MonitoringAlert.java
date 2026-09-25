package com.taaskr.entity.observability;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "monitoring_alerts",
        indexes = {
                @Index(name = "idx_alert_state", columnList = "state"),
                @Index(name = "idx_alert_endpoint", columnList = "endpoint_id")
        }
)
public class MonitoringAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "incident_id")
    private MonitoringIncident incident;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "endpoint_id", nullable = false)
    private MonitoredEndpoint endpoint;

    @Column(nullable = false, length = 50)
    private String alertType; // API_UNAVAILABLE, PERSISTENT_5XX, TIMEOUT, HIGH_LATENCY, RECOVERY

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private IncidentSeverity severity = IncidentSeverity.HIGH;

    @Column(nullable = false, length = 500)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AlertState state = AlertState.ACTIVE;

    private Integer escalationLevel = 1;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime resolvedAt;

    public MonitoringAlert() {}

    public MonitoringAlert(MonitoredEndpoint endpoint, MonitoringIncident incident, String alertType, IncidentSeverity severity, String message) {
        this.endpoint = endpoint;
        this.incident = incident;
        this.alertType = alertType;
        this.severity = severity;
        this.message = message;
        this.state = AlertState.ACTIVE;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public MonitoringIncident getIncident() { return incident; }
    public MonitoredEndpoint getEndpoint() { return endpoint; }
    public String getAlertType() { return alertType; }
    public IncidentSeverity getSeverity() { return severity; }
    public String getMessage() { return message; }
    public AlertState getState() { return state; }
    public Integer getEscalationLevel() { return escalationLevel; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getResolvedAt() { return resolvedAt; }

    public void setId(Long id) { this.id = id; }
    public void setIncident(MonitoringIncident incident) { this.incident = incident; }
    public void setEndpoint(MonitoredEndpoint endpoint) { this.endpoint = endpoint; }
    public void setAlertType(String alertType) { this.alertType = alertType; }
    public void setSeverity(IncidentSeverity severity) { this.severity = severity; }
    public void setMessage(String message) { this.message = message; }
    public void setState(AlertState state) { this.state = state; }
    public void setEscalationLevel(Integer escalationLevel) { this.escalationLevel = escalationLevel; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setResolvedAt(LocalDateTime resolvedAt) { this.resolvedAt = resolvedAt; }
}
