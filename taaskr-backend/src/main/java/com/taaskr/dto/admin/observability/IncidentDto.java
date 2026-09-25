package com.taaskr.dto.admin.observability;

import com.taaskr.entity.observability.IncidentSeverity;
import com.taaskr.entity.observability.IncidentStatus;
import com.taaskr.entity.observability.MonitoringIncident;

import java.time.LocalDateTime;

public class IncidentDto {

    private Long id;
    private Long endpointId;
    private String endpointName;
    private String endpointPath;
    private IncidentStatus status;
    private IncidentSeverity severity;
    private LocalDateTime startedAt;
    private LocalDateTime lastObservedFailure;
    private LocalDateTime resolvedAt;
    private Integer currentStatusCode;
    private String failureReason;
    private Integer failedCheckCount;
    private Integer escalationLevel;
    private String acknowledgedBy;
    private LocalDateTime acknowledgedAt;

    public IncidentDto() {}

    public static IncidentDto fromEntity(MonitoringIncident entity) {
        if (entity == null) return null;
        IncidentDto dto = new IncidentDto();
        dto.setId(entity.getId());
        if (entity.getEndpoint() != null) {
            dto.setEndpointId(entity.getEndpoint().getId());
            dto.setEndpointName(entity.getEndpoint().getName());
            dto.setEndpointPath(entity.getEndpoint().getUrlPath());
        }
        dto.setStatus(entity.getStatus());
        dto.setSeverity(entity.getSeverity());
        dto.setStartedAt(entity.getStartedAt());
        dto.setLastObservedFailure(entity.getLastObservedFailure());
        dto.setResolvedAt(entity.getResolvedAt());
        dto.setCurrentStatusCode(entity.getCurrentStatusCode());
        dto.setFailureReason(entity.getFailureReason());
        dto.setFailedCheckCount(entity.getFailedCheckCount());
        dto.setEscalationLevel(entity.getEscalationLevel());
        dto.setAcknowledgedBy(entity.getAcknowledgedBy());
        dto.setAcknowledgedAt(entity.getAcknowledgedAt());
        return dto;
    }

    public Long getId() { return id; }
    public Long getEndpointId() { return endpointId; }
    public String getEndpointName() { return endpointName; }
    public String getEndpointPath() { return endpointPath; }
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
    public void setEndpointId(Long endpointId) { this.endpointId = endpointId; }
    public void setEndpointName(String endpointName) { this.endpointName = endpointName; }
    public void setEndpointPath(String endpointPath) { this.endpointPath = endpointPath; }
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
