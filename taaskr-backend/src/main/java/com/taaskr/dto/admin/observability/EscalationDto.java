package com.taaskr.dto.admin.observability;

import com.taaskr.entity.observability.AlertEscalation;
import com.taaskr.entity.observability.NotificationChannelType;

import java.time.LocalDateTime;

public class EscalationDto {

    private Long id;
    private Long incidentId;
    private Integer escalationLevel;
    private Integer delayMinutes;
    private NotificationChannelType channelType;
    private String recipient;
    private String status;
    private LocalDateTime triggeredAt;

    public EscalationDto() {}

    public static EscalationDto fromEntity(AlertEscalation entity) {
        if (entity == null) return null;
        EscalationDto dto = new EscalationDto();
        dto.setId(entity.getId());
        if (entity.getIncident() != null) dto.setIncidentId(entity.getIncident().getId());
        dto.setEscalationLevel(entity.getEscalationLevel());
        dto.setDelayMinutes(entity.getDelayMinutes());
        dto.setChannelType(entity.getChannelType());
        dto.setRecipient(entity.getRecipient());
        dto.setStatus(entity.getStatus());
        dto.setTriggeredAt(entity.getTriggeredAt());
        return dto;
    }

    public Long getId() { return id; }
    public Long getIncidentId() { return incidentId; }
    public Integer getEscalationLevel() { return escalationLevel; }
    public Integer getDelayMinutes() { return delayMinutes; }
    public NotificationChannelType getChannelType() { return channelType; }
    public String getRecipient() { return recipient; }
    public String getStatus() { return status; }
    public LocalDateTime getTriggeredAt() { return triggeredAt; }

    public void setId(Long id) { this.id = id; }
    public void setIncidentId(Long incidentId) { this.incidentId = incidentId; }
    public void setEscalationLevel(Integer escalationLevel) { this.escalationLevel = escalationLevel; }
    public void setDelayMinutes(Integer delayMinutes) { this.delayMinutes = delayMinutes; }
    public void setChannelType(NotificationChannelType channelType) { this.channelType = channelType; }
    public void setRecipient(String recipient) { this.recipient = recipient; }
    public void setStatus(String status) { this.status = status; }
    public void setTriggeredAt(LocalDateTime triggeredAt) { this.triggeredAt = triggeredAt; }
}
