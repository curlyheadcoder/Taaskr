package com.taaskr.entity.observability;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "health_check_results",
        indexes = {
                @Index(name = "idx_check_endpoint_time", columnList = "endpoint_id, checked_at"),
                @Index(name = "idx_check_checked_at", columnList = "checked_at")
        }
)
public class HealthCheckResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "endpoint_id", nullable = false)
    private MonitoredEndpoint endpoint;

    private Integer statusCode;

    @Column(nullable = false)
    private Long responseTimeMs;

    @Column(nullable = false)
    private Boolean success;

    @Column(length = 500)
    private String errorMessage;

    @Column(name = "checked_at", nullable = false, updatable = false)
    private LocalDateTime checkedAt = LocalDateTime.now();

    public HealthCheckResult() {}

    public HealthCheckResult(MonitoredEndpoint endpoint, Integer statusCode, Long responseTimeMs, Boolean success, String errorMessage) {
        this.endpoint = endpoint;
        this.statusCode = statusCode;
        this.responseTimeMs = responseTimeMs;
        this.success = success;
        this.errorMessage = errorMessage;
        this.checkedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public MonitoredEndpoint getEndpoint() { return endpoint; }
    public Integer getStatusCode() { return statusCode; }
    public Long getResponseTimeMs() { return responseTimeMs; }
    public Boolean getSuccess() { return success; }
    public String getErrorMessage() { return errorMessage; }
    public LocalDateTime getCheckedAt() { return checkedAt; }

    public void setId(Long id) { this.id = id; }
    public void setEndpoint(MonitoredEndpoint endpoint) { this.endpoint = endpoint; }
    public void setStatusCode(Integer statusCode) { this.statusCode = statusCode; }
    public void setResponseTimeMs(Long responseTimeMs) { this.responseTimeMs = responseTimeMs; }
    public void setSuccess(Boolean success) { this.success = success; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    public void setCheckedAt(LocalDateTime checkedAt) { this.checkedAt = checkedAt; }
}
