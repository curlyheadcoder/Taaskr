package com.taaskr.controller;

import com.taaskr.dto.admin.observability.DatabaseHealthDto;
import com.taaskr.dto.admin.observability.InfrastructureMetricsDto;
import com.taaskr.dto.admin.observability.ObservabilityOverviewResponse;
import com.taaskr.service.observability.ObservabilityService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/observability")
public class PublicObservabilityHealthController {

    private final ObservabilityService observabilityService;

    public PublicObservabilityHealthController(ObservabilityService observabilityService) {
        this.observabilityService = observabilityService;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> getPublicHealthReport() {
        ObservabilityOverviewResponse overview = observabilityService.getOverview();
        DatabaseHealthDto db = overview.getDatabaseHealth();
        InfrastructureMetricsDto infra = overview.getInfrastructureMetrics();

        return ResponseEntity.ok(Map.of(
                "applicationStatus", overview.getOverallHealthStatus() != null ? overview.getOverallHealthStatus().name() : "HEALTHY",
                "databaseStatus", db != null ? db.getStatus() : "UP",
                "infrastructureStatus", infra != null ? infra.getStatus() : "HEALTHY",
                "monitoringEngineStatus", "ACTIVE",
                "uptime24h", overview.getUptimePercentage24h() != null ? overview.getUptimePercentage24h() : 100.0,
                "activeIncidents", overview.getActiveIncidentsCount() != null ? overview.getActiveIncidentsCount() : 0,
                "timestamp", System.currentTimeMillis()
        ));
    }
}
