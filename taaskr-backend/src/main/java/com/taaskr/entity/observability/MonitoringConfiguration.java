package com.taaskr.entity.observability;

import jakarta.persistence.*;

@Entity
@Table(name = "monitoring_configurations")
public class MonitoringConfiguration {

    @Id
    private Long id = 1L; // Singleton config record

    @Column(nullable = false)
    private Boolean monitoringEnabled = true;

    @Column(nullable = false)
    private Integer checkIntervalSeconds = 30;

    @Column(nullable = false)
    private Integer defaultTimeoutMs = 5000;

    @Column(nullable = false)
    private Integer defaultFailureThreshold = 3;

    @Column(nullable = false)
    private Integer defaultRecoveryThreshold = 2;

    @Column(nullable = false)
    private Integer defaultLatencyThresholdMs = 1000;

    @Column(nullable = false)
    private Integer healthCheckRetentionDays = 30;

    @Column(nullable = false)
    private Integer incidentRetentionDays = 90;

    @Column(nullable = false)
    private Integer alertRetentionDays = 90;

    @Column(nullable = false)
    private Boolean emailNotificationsEnabled = false;

    @Column(length = 255)
    private String adminNotificationEmail = "admin@taaskr.com";

    @Column(length = 500)
    private String slackWebhookUrl;

    @Column(length = 500)
    private String teamsWebhookUrl;

    public MonitoringConfiguration() {}

    public Long getId() { return id; }
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

    public void setId(Long id) { this.id = id; }
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
