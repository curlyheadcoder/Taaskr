package com.taaskr.dto.ai;

import java.math.BigDecimal;

public class AiDiagnosticResponse {

    private Long serviceId;
    private String serviceName;
    private Long categoryId;
    private String categoryName;
    private BigDecimal price;
    private Integer durationMinutes;
    private String reason;
    private String urgency; // LOW, MEDIUM, HIGH, EMERGENCY

    public AiDiagnosticResponse() {
    }

    public AiDiagnosticResponse(Long serviceId, String serviceName, Long categoryId, String categoryName,
                                BigDecimal price, Integer durationMinutes, String reason, String urgency) {
        this.serviceId = serviceId;
        this.serviceName = serviceName;
        this.categoryId = categoryId;
        this.categoryName = categoryName;
        this.price = price;
        this.durationMinutes = durationMinutes;
        this.reason = reason;
        this.urgency = urgency;
    }

    public Long getServiceId() {
        return serviceId;
    }

    public String getServiceName() {
        return serviceName;
    }

    public Long getCategoryId() {
        return categoryId;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public Integer getDurationMinutes() {
        return durationMinutes;
    }

    public String getReason() {
        return reason;
    }

    public String getUrgency() {
        return urgency;
    }

    public void setServiceId(Long serviceId) {
        this.serviceId = serviceId;
    }

    public void setServiceName(String serviceName) {
        this.serviceName = serviceName;
    }

    public void setCategoryId(Long categoryId) {
        this.categoryId = categoryId;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public void setDurationMinutes(Integer durationMinutes) {
        this.durationMinutes = durationMinutes;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public void setUrgency(String urgency) {
        this.urgency = urgency;
    }
}
