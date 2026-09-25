package com.taaskr.service.observability;

import com.taaskr.entity.observability.MonitoringAlert;
import com.taaskr.entity.observability.MonitoringIncident;
import com.taaskr.entity.observability.NotificationChannelType;

public interface NotificationChannel {

    NotificationChannelType getChannelType();

    boolean sendAlert(MonitoringAlert alert, String recipient);

    boolean sendIncidentEscalation(MonitoringIncident incident, int level, String recipient);

    boolean sendRecoveryNotification(MonitoringIncident incident, String recipient);
}
