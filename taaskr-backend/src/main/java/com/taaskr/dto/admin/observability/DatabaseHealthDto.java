package com.taaskr.dto.admin.observability;

public class DatabaseHealthDto {

    private String status = "UP";
    private String databaseType = "MySQL 8.0 / HikariCP";
    private Integer activeConnections = 2;
    private Integer idleConnections = 3;
    private Integer maxPoolSize = 5;
    private Double poolUtilizationPercentage = 40.0;
    private Long queryLatencyMs = 2L;

    public DatabaseHealthDto() {}

    public DatabaseHealthDto(String status, String databaseType, Integer activeConnections, Integer idleConnections, Integer maxPoolSize, Double poolUtilizationPercentage, Long queryLatencyMs) {
        this.status = status;
        this.databaseType = databaseType;
        this.activeConnections = activeConnections;
        this.idleConnections = idleConnections;
        this.maxPoolSize = maxPoolSize;
        this.poolUtilizationPercentage = poolUtilizationPercentage;
        this.queryLatencyMs = queryLatencyMs;
    }

    public String getStatus() { return status; }
    public String getDatabaseType() { return databaseType; }
    public Integer getActiveConnections() { return activeConnections; }
    public Integer getIdleConnections() { return idleConnections; }
    public Integer getMaxPoolSize() { return maxPoolSize; }
    public Double getPoolUtilizationPercentage() { return poolUtilizationPercentage; }
    public Long getQueryLatencyMs() { return queryLatencyMs; }

    public void setStatus(String status) { this.status = status; }
    public void setDatabaseType(String databaseType) { this.databaseType = databaseType; }
    public void setActiveConnections(Integer activeConnections) { this.activeConnections = activeConnections; }
    public void setIdleConnections(Integer idleConnections) { this.idleConnections = idleConnections; }
    public void setMaxPoolSize(Integer maxPoolSize) { this.maxPoolSize = maxPoolSize; }
    public void setPoolUtilizationPercentage(Double poolUtilizationPercentage) { this.poolUtilizationPercentage = poolUtilizationPercentage; }
    public void setQueryLatencyMs(Long queryLatencyMs) { this.queryLatencyMs = queryLatencyMs; }
}
