package com.taaskr.dto.admin.observability;

import com.taaskr.entity.observability.AlertState;
import com.taaskr.entity.observability.IncidentSeverity;
import com.taaskr.entity.observability.MonitoringAlert;

import java.time.LocalDateTime;

public class AlertDto {

    private Long id;
    private Long incidentId;
    private Long endpointId;
    private String endpointName;
    private String alertType;
    private IncidentSeverity severity;
    private String message;
    private AlertState state;
    private Integer escalationLevel;
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;

    public AlertDto() {}

    public static AlertDto fromEntity(MonitoringAlert entity) {
        if (entity == null) return null;
        AlertDto dto = new AlertDto();
        dto.setId(entity.getId());
        if (entity.getIncident() != null) dto.setIncidentId(entity.getIncident().getId());
        if (entity.getEndpoint() != null) {
            dto.setEndpointId(entity.getEndpoint().getId());
            dto.setEndpointName(entity.getEndpoint().getName());
        }
        dto.setAlertType(entity.getAlertType());
        dto.setSeverity(entity.getSeverity());
        dto.setMessage(entity.getMessage());
        dto.setState(entity.getState());
        dto.setEscalationLevel(entity.getEscalationLevel());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setResolvedAt(entity.getResolvedAt());
        return dto;
    }

    public Long getId() { return id; }
    public Long getIncidentId() { return incidentId; }
    public Long getEndpointId() { return endpointId; }
    public String getEndpointName() { return endpointName; }
    public String getAlertType() { return alertType; }
    public IncidentSeverity getSeverity() { return severity; }
    public String getMessage() { return message; }
    public AlertState getState() { return state; }
    public Integer getEscalationLevel() { return escalationLevel; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getResolvedAt() { return resolvedAt; }

    public void setId(Long id) { this.id = id; }
    public void setIncidentId(Long incidentId) { this.incidentId = incidentId; }
    public void setEndpointId(Long endpointId) { this.endpointId = endpointId; }
    public void setEndpointName(String endpointName) { this.endpointName = endpointName; }
    public void setAlertType(String alertType) { this.alertType = alertType; }
    public void setSeverity(IncidentSeverity severity) { this.severity = severity; }
    public void setMessage(String message) { this.message = message; }
    public void setState(AlertState state) { this.state = state; }
    public void setEscalationLevel(Integer escalationLevel) { this.escalationLevel = escalationLevel; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setResolvedAt(LocalDateTime resolvedAt) { this.resolvedAt = resolvedAt; }
}
