package com.taaskr.service;

import java.time.Duration;

public interface AppMetricsService {
    void recordBookingCreated(String categoryName, String serviceName);
    void recordBookingStatusChanged(String previousStatus, String newStatus);
    void recordPayment(String status, double amount);
    void recordAiDiagnostic(boolean success, Duration duration);
}
