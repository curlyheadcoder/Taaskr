package com.taaskr.dto.admin.observability;

import com.taaskr.entity.observability.MonitoringConfiguration;

public class MonitoringConfigDto {

    private Boolean monitoringEnabled = true;
    private Integer checkIntervalSeconds = 30;
    private Integer defaultTimeoutMs = 5000;
    private Integer defaultFailureThreshold = 3;
    private Integer defaultRecoveryThreshold = 2;
    private Integer defaultLatencyThresholdMs = 1000;
    private Integer healthCheckRetentionDays = 30;
    private Integer incidentRetentionDays = 90;
    private Integer alertRetentionDays = 90;
    private Boolean emailNotificationsEnabled = false;
    private String adminNotificationEmail = "admin@taaskr.com";
    private String slackWebhookUrl;
    private String teamsWebhookUrl;

    public MonitoringConfigDto() {}

    public static MonitoringConfigDto fromEntity(MonitoringConfiguration entity) {
        if (entity == null) return new MonitoringConfigDto();
        MonitoringConfigDto dto = new MonitoringConfigDto();
        dto.setMonitoringEnabled(entity.getMonitoringEnabled());
        dto.setCheckIntervalSeconds(entity.getCheckIntervalSeconds());
        dto.setDefaultTimeoutMs(entity.getDefaultTimeoutMs());
        dto.setDefaultFailureThreshold(entity.getDefaultFailureThreshold());
        dto.setDefaultRecoveryThreshold(entity.getDefaultRecoveryThreshold());
        dto.setDefaultLatencyThresholdMs(entity.getDefaultLatencyThresholdMs());
        dto.setHealthCheckRetentionDays(entity.getHealthCheckRetentionDays());
        dto.setIncidentRetentionDays(entity.getIncidentRetentionDays());
        dto.setAlertRetentionDays(entity.getAlertRetentionDays());
        dto.setEmailNotificationsEnabled(entity.getEmailNotificationsEnabled());
        dto.setAdminNotificationEmail(entity.getAdminNotificationEmail());
        dto.setSlackWebhookUrl(entity.getSlackWebhookUrl());
        dto.setTeamsWebhookUrl(entity.getTeamsWebhookUrl());
        return dto;
    }

    public Boolean getMonitoringEnabled() { return monitoringEnabled; }
    public Integer getCheckIntervalSeconds() { return checkIntervalSeconds; }
    public Integer getDefaultTimeoutMs() { return defaultTimeoutMs; }
    public Integer getDefaultFailureThreshold() { return defaultFailureThreshold; }
    public Integer getDefaultRecoveryThreshold() { return defaultRecoveryThreshold; }
    public Integer getDefaultLatencyThresholdMs() { return defaultLatencyThresholdMs; }
    public Integer getHealthCheckRetentionDays() { return healthCheckRetentionDays; }
    public Integer getIncidentRetentionDays() { return incidentRetentionDays; }
    public Integer getAlertRetentionDays() { return alertRetentionDays; }
    public Boolean getEmailNotificationsEnabled() { return emailNotificationsEnabled; }
    public String getAdminNotificationEmail() { return adminNotificationEmail; }
    public String getSlackWebhookUrl() { return slackWebhookUrl; }
    public String getTeamsWebhookUrl() { return teamsWebhookUrl; }

    public void setMonitoringEnabled(Boolean monitoringEnabled) { this.monitoringEnabled = monitoringEnabled; }
    public void setCheckIntervalSeconds(Integer checkIntervalSeconds) { this.checkIntervalSeconds = checkIntervalSeconds; }
    public void setDefaultTimeoutMs(Integer defaultTimeoutMs) { this.defaultTimeoutMs = defaultTimeoutMs; }
    public void setDefaultFailureThreshold(Integer defaultFailureThreshold) { this.defaultFailureThreshold = defaultFailureThreshold; }
    public void setDefaultRecoveryThreshold(Integer defaultRecoveryThreshold) { this.defaultRecoveryThreshold = defaultRecoveryThreshold; }
    public void setDefaultLatencyThresholdMs(Integer defaultLatencyThresholdMs) { this.defaultLatencyThresholdMs = defaultLatencyThresholdMs; }
    public void setHealthCheckRetentionDays(Integer healthCheckRetentionDays) { this.healthCheckRetentionDays = healthCheckRetentionDays; }
    public void setIncidentRetentionDays(Integer incidentRetentionDays) { this.incidentRetentionDays = incidentRetentionDays; }
    public void setAlertRetentionDays(Integer alertRetentionDays) { this.alertRetentionDays = alertRetentionDays; }
    public void setEmailNotificationsEnabled(Boolean emailNotificationsEnabled) { this.emailNotificationsEnabled = emailNotificationsEnabled; }
    public void setAdminNotificationEmail(String adminNotificationEmail) { this.adminNotificationEmail = adminNotificationEmail; }
    public void setSlackWebhookUrl(String slackWebhookUrl) { this.slackWebhookUrl = slackWebhookUrl; }
    public void setTeamsWebhookUrl(String teamsWebhookUrl) { this.teamsWebhookUrl = teamsWebhookUrl; }
}
