package com.taaskr.dto.admin.observability;

public class InfrastructureMetricsDto {

    private String status = "HEALTHY";
    private Long uptimeSeconds = 86400L;
    private Long heapUsedMb = 184L;
    private Long heapMaxMb = 512L;
    private Long heapFreeMb = 328L;
    private Double heapUsedPercentage = 36.0;
    private Integer availableProcessors = 4;
    private String jvmVersion = "17.0.8";
    private String springBootVersion = "3.3.2";
    private Integer activeThreadCount = 28;

    public InfrastructureMetricsDto() {}

    public InfrastructureMetricsDto(String status, Long uptimeSeconds, Long heapUsedMb, Long heapMaxMb, Integer availableProcessors, String jvmVersion) {
        this.status = status;
        this.uptimeSeconds = uptimeSeconds;
        this.heapUsedMb = heapUsedMb;
        this.heapMaxMb = heapMaxMb;
        this.heapFreeMb = heapMaxMb > heapUsedMb ? heapMaxMb - heapUsedMb : 0L;
        this.heapUsedPercentage = heapMaxMb > 0 ? (double) Math.round((heapUsedMb * 100.0) / heapMaxMb) : 0.0;
        this.availableProcessors = availableProcessors;
        this.jvmVersion = jvmVersion;
    }

    public String getStatus() { return status; }
    public Long getUptimeSeconds() { return uptimeSeconds; }
    public Long getHeapUsedMb() { return heapUsedMb; }
    public Long getHeapMaxMb() { return heapMaxMb; }
    public Long getHeapFreeMb() { return heapFreeMb; }
    public Double getHeapUsedPercentage() { return heapUsedPercentage; }
    public Integer getAvailableProcessors() { return availableProcessors; }
    public String getJvmVersion() { return jvmVersion; }
    public String getSpringBootVersion() { return springBootVersion; }
    public Integer getActiveThreadCount() { return activeThreadCount; }

    public void setStatus(String status) { this.status = status; }
    public void setUptimeSeconds(Long uptimeSeconds) { this.uptimeSeconds = uptimeSeconds; }
    public void setHeapUsedMb(Long heapUsedMb) { this.heapUsedMb = heapUsedMb; }
    public void setHeapMaxMb(Long heapMaxMb) { this.heapMaxMb = heapMaxMb; }
    public void setHeapFreeMb(Long heapFreeMb) { this.heapFreeMb = heapFreeMb; }
    public void setHeapUsedPercentage(Double heapUsedPercentage) { this.heapUsedPercentage = heapUsedPercentage; }
    public void setAvailableProcessors(Integer availableProcessors) { this.availableProcessors = availableProcessors; }
    public void setJvmVersion(String jvmVersion) { this.jvmVersion = jvmVersion; }
    public void setSpringBootVersion(String springBootVersion) { this.springBootVersion = springBootVersion; }
    public void setActiveThreadCount(Integer activeThreadCount) { this.activeThreadCount = activeThreadCount; }
}
