package com.taaskr.dto.admin.observability;

import com.taaskr.entity.observability.HealthCheckResult;

import java.time.LocalDateTime;

public class HealthCheckResultDto {

    private Long id;
    private Long endpointId;
    private String endpointName;
    private Integer statusCode;
    private Long responseTimeMs;
    private Boolean success;
    private String errorMessage;
    private LocalDateTime checkedAt;

    public HealthCheckResultDto() {}

    public static HealthCheckResultDto fromEntity(HealthCheckResult entity) {
        if (entity == null) return null;
        HealthCheckResultDto dto = new HealthCheckResultDto();
        dto.setId(entity.getId());
        if (entity.getEndpoint() != null) {
            dto.setEndpointId(entity.getEndpoint().getId());
            dto.setEndpointName(entity.getEndpoint().getName());
        }
        dto.setStatusCode(entity.getStatusCode());
        dto.setResponseTimeMs(entity.getResponseTimeMs());
        dto.setSuccess(entity.getSuccess());
        dto.setErrorMessage(entity.getErrorMessage());
        dto.setCheckedAt(entity.getCheckedAt());
        return dto;
    }

    public Long getId() { return id; }
    public Long getEndpointId() { return endpointId; }
    public String getEndpointName() { return endpointName; }
    public Integer getStatusCode() { return statusCode; }
    public Long getResponseTimeMs() { return responseTimeMs; }
    public Boolean getSuccess() { return success; }
    public String getErrorMessage() { return errorMessage; }
    public LocalDateTime getCheckedAt() { return checkedAt; }

    public void setId(Long id) { this.id = id; }
    public void setEndpointId(Long endpointId) { this.endpointId = endpointId; }
    public void setEndpointName(String endpointName) { this.endpointName = endpointName; }
    public void setStatusCode(Integer statusCode) { this.statusCode = statusCode; }
    public void setResponseTimeMs(Long responseTimeMs) { this.responseTimeMs = responseTimeMs; }
    public void setSuccess(Boolean success) { this.success = success; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    public void setCheckedAt(LocalDateTime checkedAt) { this.checkedAt = checkedAt; }
}
