package com.taaskr.dto.admin.observability;

import com.taaskr.entity.observability.EndpointHealthState;
import com.taaskr.entity.observability.MonitoredEndpoint;

import java.time.LocalDateTime;

public class MonitoredEndpointDto {

    private Long id;
    private String name;
    private String httpMethod;
    private String urlPath;
    private Boolean enabled;
    private Integer timeoutMs;
    private Integer failureThreshold;
    private Integer recoveryThreshold;
    private Integer latencyThresholdMs;
    private EndpointHealthState currentState;
    private Integer consecutiveFailures;
    private Integer consecutiveSuccesses;
    private LocalDateTime lastCheckTime;
    private LocalDateTime lastSuccessTime;
    private LocalDateTime lastFailureTime;
    private Integer lastStatusCode;
    private Long lastResponseTimeMs;
    private LocalDateTime createdAt;

    public MonitoredEndpointDto() {}

    public static MonitoredEndpointDto fromEntity(MonitoredEndpoint entity) {
        if (entity == null) return null;
        MonitoredEndpointDto dto = new MonitoredEndpointDto();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setHttpMethod(entity.getHttpMethod());
        dto.setUrlPath(entity.getUrlPath());
        dto.setEnabled(entity.getEnabled());
        dto.setTimeoutMs(entity.getTimeoutMs());
        dto.setFailureThreshold(entity.getFailureThreshold());
        dto.setRecoveryThreshold(entity.getRecoveryThreshold());
        dto.setLatencyThresholdMs(entity.getLatencyThresholdMs());
        dto.setCurrentState(entity.getCurrentState());
        dto.setConsecutiveFailures(entity.getConsecutiveFailures());
        dto.setConsecutiveSuccesses(entity.getConsecutiveSuccesses());
        dto.setLastCheckTime(entity.getLastCheckTime());
        dto.setLastSuccessTime(entity.getLastSuccessTime());
        dto.setLastFailureTime(entity.getLastFailureTime());
        dto.setLastStatusCode(entity.getLastStatusCode());
        dto.setLastResponseTimeMs(entity.getLastResponseTimeMs());
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getHttpMethod() { return httpMethod; }
    public String getUrlPath() { return urlPath; }
    public Boolean getEnabled() { return enabled; }
    public Integer getTimeoutMs() { return timeoutMs; }
    public Integer getFailureThreshold() { return failureThreshold; }
    public Integer getRecoveryThreshold() { return recoveryThreshold; }
    public Integer getLatencyThresholdMs() { return latencyThresholdMs; }
    public EndpointHealthState getCurrentState() { return currentState; }
    public Integer getConsecutiveFailures() { return consecutiveFailures; }
    public Integer getConsecutiveSuccesses() { return consecutiveSuccesses; }
    public LocalDateTime getLastCheckTime() { return lastCheckTime; }
    public LocalDateTime getLastSuccessTime() { return lastSuccessTime; }
    public LocalDateTime getLastFailureTime() { return lastFailureTime; }
    public Integer getLastStatusCode() { return lastStatusCode; }
    public Long getLastResponseTimeMs() { return lastResponseTimeMs; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setId(Long id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setHttpMethod(String httpMethod) { this.httpMethod = httpMethod; }
    public void setUrlPath(String urlPath) { this.urlPath = urlPath; }
    public void setEnabled(Boolean enabled) { this.enabled = enabled; }
    public void setTimeoutMs(Integer timeoutMs) { this.timeoutMs = timeoutMs; }
    public void setFailureThreshold(Integer failureThreshold) { this.failureThreshold = failureThreshold; }
    public void setRecoveryThreshold(Integer recoveryThreshold) { this.recoveryThreshold = recoveryThreshold; }
    public void setLatencyThresholdMs(Integer latencyThresholdMs) { this.latencyThresholdMs = latencyThresholdMs; }
    public void setCurrentState(EndpointHealthState currentState) { this.currentState = currentState; }
    public void setConsecutiveFailures(Integer consecutiveFailures) { this.consecutiveFailures = consecutiveFailures; }
    public void setConsecutiveSuccesses(Integer consecutiveSuccesses) { this.consecutiveSuccesses = consecutiveSuccesses; }
    public void setLastCheckTime(LocalDateTime lastCheckTime) { this.lastCheckTime = lastCheckTime; }
    public void setLastSuccessTime(LocalDateTime lastSuccessTime) { this.lastSuccessTime = lastSuccessTime; }
    public void setLastFailureTime(LocalDateTime lastFailureTime) { this.lastFailureTime = lastFailureTime; }
    public void setLastStatusCode(Integer lastStatusCode) { this.lastStatusCode = lastStatusCode; }
    public void setLastResponseTimeMs(Long lastResponseTimeMs) { this.lastResponseTimeMs = lastResponseTimeMs; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
