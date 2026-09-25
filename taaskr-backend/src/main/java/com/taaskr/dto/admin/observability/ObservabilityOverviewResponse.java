package com.taaskr.dto.admin.observability;

import com.taaskr.entity.observability.EndpointHealthState;

public class ObservabilityOverviewResponse {

    private EndpointHealthState overallHealthStatus;
    private Double uptimePercentage24h;
    private Double uptimePercentage7d;
    private Double uptimePercentage30d;
    private Long totalMonitoredEndpoints;
    private Long healthyEndpointsCount;
    private Long degradedEndpointsCount;
    private Long unhealthyEndpointsCount;
    private Long activeIncidentsCount;
    private Long openAlertsCount;
    private Double avgResponseTimeMs;
    private Double p95ResponseTimeMs;
    private Double p99ResponseTimeMs;
    private Double errorRatePercentage;
    private Long totalChecksCount;
    private DatabaseHealthDto databaseHealth;
    private InfrastructureMetricsDto infrastructureMetrics;

    public ObservabilityOverviewResponse() {}

    public EndpointHealthState getOverallHealthStatus() { return overallHealthStatus; }
    public Double getUptimePercentage24h() { return uptimePercentage24h; }
    public Double getUptimePercentage7d() { return uptimePercentage7d; }
    public Double getUptimePercentage30d() { return uptimePercentage30d; }
    public Long getTotalMonitoredEndpoints() { return totalMonitoredEndpoints; }
    public Long getHealthyEndpointsCount() { return healthyEndpointsCount; }
    public Long getDegradedEndpointsCount() { return degradedEndpointsCount; }
    public Long getUnhealthyEndpointsCount() { return unhealthyEndpointsCount; }
    public Long getActiveIncidentsCount() { return activeIncidentsCount; }
    public Long getOpenAlertsCount() { return openAlertsCount; }
    public Double getAvgResponseTimeMs() { return avgResponseTimeMs; }
    public Double getP95ResponseTimeMs() { return p95ResponseTimeMs; }
    public Double getP99ResponseTimeMs() { return p99ResponseTimeMs; }
    public Double getErrorRatePercentage() { return errorRatePercentage; }
    public Long getTotalChecksCount() { return totalChecksCount; }
    public DatabaseHealthDto getDatabaseHealth() { return databaseHealth; }
    public InfrastructureMetricsDto getInfrastructureMetrics() { return infrastructureMetrics; }

    public void setOverallHealthStatus(EndpointHealthState overallHealthStatus) { this.overallHealthStatus = overallHealthStatus; }
    public void setUptimePercentage24h(Double uptimePercentage24h) { this.uptimePercentage24h = uptimePercentage24h; }
    public void setUptimePercentage7d(Double uptimePercentage7d) { this.uptimePercentage7d = uptimePercentage7d; }
    public void setUptimePercentage30d(Double uptimePercentage30d) { this.uptimePercentage30d = uptimePercentage30d; }
    public void setTotalMonitoredEndpoints(Long totalMonitoredEndpoints) { this.totalMonitoredEndpoints = totalMonitoredEndpoints; }
    public void setHealthyEndpointsCount(Long healthyEndpointsCount) { this.healthyEndpointsCount = healthyEndpointsCount; }
    public void setDegradedEndpointsCount(Long degradedEndpointsCount) { this.degradedEndpointsCount = degradedEndpointsCount; }
    public void setUnhealthyEndpointsCount(Long unhealthyEndpointsCount) { this.unhealthyEndpointsCount = unhealthyEndpointsCount; }
    public void setActiveIncidentsCount(Long activeIncidentsCount) { this.activeIncidentsCount = activeIncidentsCount; }
    public void setOpenAlertsCount(Long openAlertsCount) { this.openAlertsCount = openAlertsCount; }
    public void setAvgResponseTimeMs(Double avgResponseTimeMs) { this.avgResponseTimeMs = avgResponseTimeMs; }
    public void setP95ResponseTimeMs(Double p95ResponseTimeMs) { this.p95ResponseTimeMs = p95ResponseTimeMs; }
    public void setP99ResponseTimeMs(Double p99ResponseTimeMs) { this.p99ResponseTimeMs = p99ResponseTimeMs; }
    public void setErrorRatePercentage(Double errorRatePercentage) { this.errorRatePercentage = errorRatePercentage; }
    public void setTotalChecksCount(Long totalChecksCount) { this.totalChecksCount = totalChecksCount; }
    public void setDatabaseHealth(DatabaseHealthDto databaseHealth) { this.databaseHealth = databaseHealth; }
    public void setInfrastructureMetrics(InfrastructureMetricsDto infrastructureMetrics) { this.infrastructureMetrics = infrastructureMetrics; }
}
