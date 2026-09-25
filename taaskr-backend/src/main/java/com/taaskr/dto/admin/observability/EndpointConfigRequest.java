package com.taaskr.dto.admin.observability;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class EndpointConfigRequest {

    @NotBlank(message = "Endpoint name is required")
    private String name;

    @NotBlank(message = "HTTP method is required")
    private String httpMethod = "GET";

    @NotBlank(message = "URL path is required")
    private String urlPath;

    @NotNull(message = "Enabled flag is required")
    private Boolean enabled = true;

    private Integer timeoutMs = 5000;
    private Integer failureThreshold = 3;
    private Integer recoveryThreshold = 2;
    private Integer latencyThresholdMs = 1000;

    public EndpointConfigRequest() {}

    public String getName() { return name; }
    public String getHttpMethod() { return httpMethod; }
    public String getUrlPath() { return urlPath; }
    public Boolean getEnabled() { return enabled; }
    public Integer getTimeoutMs() { return timeoutMs; }
    public Integer getFailureThreshold() { return failureThreshold; }
    public Integer getRecoveryThreshold() { return recoveryThreshold; }
    public Integer getLatencyThresholdMs() { return latencyThresholdMs; }

    public void setName(String name) { this.name = name; }
    public void setHttpMethod(String httpMethod) { this.httpMethod = httpMethod; }
    public void setUrlPath(String urlPath) { this.urlPath = urlPath; }
    public void setEnabled(Boolean enabled) { this.enabled = enabled; }
    public void setTimeoutMs(Integer timeoutMs) { this.timeoutMs = timeoutMs; }
    public void setFailureThreshold(Integer failureThreshold) { this.failureThreshold = failureThreshold; }
    public void setRecoveryThreshold(Integer recoveryThreshold) { this.recoveryThreshold = recoveryThreshold; }
    public void setLatencyThresholdMs(Integer latencyThresholdMs) { this.latencyThresholdMs = latencyThresholdMs; }
}
