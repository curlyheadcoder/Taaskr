package com.taaskr.service.impl;

import com.taaskr.service.AppMetricsService;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
public class AppMetricsServiceImpl implements AppMetricsService {

    private final MeterRegistry meterRegistry;

    public AppMetricsServiceImpl(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }

    @Override
    public void recordBookingCreated(String categoryName, String serviceName) {
        Counter.builder("taaskr.bookings.created")
                .description("Total number of bookings created")
                .tag("category", categoryName != null ? categoryName : "unknown")
                .tag("service", serviceName != null ? serviceName : "unknown")
                .register(meterRegistry)
                .increment();
    }

    @Override
    public void recordBookingStatusChanged(String previousStatus, String newStatus) {
        Counter.builder("taaskr.bookings.status.changed")
                .description("Transitions of booking lifecycle statuses")
                .tag("from", previousStatus != null ? previousStatus : "NONE")
                .tag("to", newStatus != null ? newStatus : "UNKNOWN")
                .register(meterRegistry)
                .increment();
    }

    @Override
    public void recordPayment(String status, double amount) {
        Counter.builder("taaskr.payments.processed")
                .description("Total number of payment transactions processed")
                .tag("status", status != null ? status : "UNKNOWN")
                .register(meterRegistry)
                .increment();

        if (amount > 0) {
            Counter.builder("taaskr.payments.volume.inr")
                    .description("Total transaction volume processed in INR")
                    .tag("status", status != null ? status : "UNKNOWN")
                    .register(meterRegistry)
                    .increment(amount);
        }
    }

    @Override
    public void recordAiDiagnostic(boolean success, Duration duration) {
        Counter.builder("taaskr.ai.diagnostics.total")
                .description("Total AI vehicle diagnostic requests")
                .tag("status", success ? "SUCCESS" : "FAILURE")
                .register(meterRegistry)
                .increment();

        if (duration != null) {
            Timer.builder("taaskr.ai.diagnostics.duration")
                    .description("Latency of AI vehicle diagnostic inference")
                    .tag("status", success ? "SUCCESS" : "FAILURE")
                    .register(meterRegistry)
                    .record(duration);
        }
    }
}
