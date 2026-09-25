package com.taaskr.entity.observability;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "monitored_endpoints",
        indexes = {
                @Index(name = "idx_endpoint_state", columnList = "current_state"),
                @Index(name = "idx_endpoint_enabled", columnList = "enabled")
        }
)
public class MonitoredEndpoint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, length = 10)
    private String httpMethod = "GET";

    @Column(nullable = false, length = 255)
    private String urlPath;

    @Column(nullable = false)
    private Boolean enabled = true;

    @Column(nullable = false)
    private Integer timeoutMs = 5000;

    @Column(nullable = false)
    private Integer failureThreshold = 3;

    @Column(nullable = false)
    private Integer recoveryThreshold = 2;

    @Column(nullable = false)
    private Integer latencyThresholdMs = 1000;

    @Enumerated(EnumType.STRING)
    @Column(name = "current_state", nullable = false, length = 20)
    private EndpointHealthState currentState = EndpointHealthState.UNKNOWN;

    private Integer consecutiveFailures = 0;

    private Integer consecutiveSuccesses = 0;

    private LocalDateTime lastCheckTime;

    private LocalDateTime lastSuccessTime;

    private LocalDateTime lastFailureTime;

    private Integer lastStatusCode;

    private Long lastResponseTimeMs;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public MonitoredEndpoint() {}

    public MonitoredEndpoint(String name, String httpMethod, String urlPath) {
        this.name = name;
        this.httpMethod = httpMethod;
        this.urlPath = urlPath;
    }

    @PrePersist
    public void onCreate() {
        if (this.createdAt == null) this.createdAt = LocalDateTime.now();
        if (this.currentState == null) this.currentState = EndpointHealthState.UNKNOWN;
        if (this.enabled == null) this.enabled = true;
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
}
