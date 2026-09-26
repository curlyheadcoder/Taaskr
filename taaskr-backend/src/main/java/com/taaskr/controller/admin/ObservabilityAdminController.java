package com.taaskr.controller.admin;

import com.taaskr.dto.admin.observability.*;
import com.taaskr.entity.observability.IncidentStatus;
import com.taaskr.service.observability.ObservabilityService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/observability")
@PreAuthorize("hasRole('ADMIN')")
public class ObservabilityAdminController {

    private final ObservabilityService observabilityService;

    public ObservabilityAdminController(ObservabilityService observabilityService) {
        this.observabilityService = observabilityService;
    }

    @GetMapping("/overview")
    public ResponseEntity<ObservabilityOverviewResponse> getOverview() {
        return ResponseEntity.ok(observabilityService.getOverview());
    }

    @GetMapping("/endpoints")
    public ResponseEntity<List<MonitoredEndpointDto>> getAllEndpoints() {
        return ResponseEntity.ok(observabilityService.getAllMonitoredEndpoints());
    }

    @GetMapping("/endpoints/{id}")
    public ResponseEntity<MonitoredEndpointDto> getEndpointById(@PathVariable Long id) {
        MonitoredEndpointDto dto = observabilityService.getMonitoredEndpoint(id);
        if (dto == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/endpoints")
    public ResponseEntity<MonitoredEndpointDto> createEndpoint(@Valid @RequestBody EndpointConfigRequest request) {
        return ResponseEntity.ok(observabilityService.createMonitoredEndpoint(request));
    }

    @PutMapping("/endpoints/{id}")
    public ResponseEntity<MonitoredEndpointDto> updateEndpoint(@PathVariable Long id, @Valid @RequestBody EndpointConfigRequest request) {
        return ResponseEntity.ok(observabilityService.updateMonitoredEndpoint(id, request));
    }

    @PostMapping("/endpoints/{id}/toggle")
    public ResponseEntity<Map<String, String>> toggleEndpoint(@PathVariable Long id, @RequestParam boolean enabled) {
        observabilityService.toggleEndpointEnabled(id, enabled);
        return ResponseEntity.ok(Map.of("message", "Endpoint enabled status updated to " + enabled));
    }

    @DeleteMapping("/endpoints/{id}")
    public ResponseEntity<Map<String, String>> deleteEndpoint(@PathVariable Long id) {
        observabilityService.deleteMonitoredEndpoint(id);
        return ResponseEntity.ok(Map.of("message", "Endpoint deleted successfully"));
    }

    @PostMapping("/endpoints/discover")
    public ResponseEntity<List<MonitoredEndpointDto>> discoverEndpoints() {
        return ResponseEntity.ok(observabilityService.autoDiscoverApiEndpoints());
    }

    @PostMapping("/endpoints/{id}/check")
    public ResponseEntity<HealthCheckResultDto> triggerHealthCheck(@PathVariable Long id) {
        return ResponseEntity.ok(observabilityService.triggerHealthCheck(id));
    }

    @GetMapping("/endpoints/{id}/history")
    public ResponseEntity<List<HealthCheckResultDto>> getHealthHistory(@PathVariable Long id, @RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(observabilityService.getEndpointHealthHistory(id, limit));
    }

    @GetMapping("/incidents")
    public ResponseEntity<List<IncidentDto>> getIncidents(@RequestParam(required = false) List<IncidentStatus> status) {
        return ResponseEntity.ok(observabilityService.getIncidents(status));
    }

    @PostMapping("/incidents/{id}/acknowledge")
    public ResponseEntity<IncidentDto> acknowledgeIncident(@PathVariable Long id, Authentication auth) {
        String username = auth != null ? auth.getName() : "Admin";
        return ResponseEntity.ok(observabilityService.acknowledgeIncident(id, username));
    }

    @PostMapping("/incidents/{id}/resolve")
    public ResponseEntity<IncidentDto> resolveIncident(@PathVariable Long id, Authentication auth) {
        String username = auth != null ? auth.getName() : "Admin";
        return ResponseEntity.ok(observabilityService.resolveIncident(id, username));
    }

    @GetMapping("/alerts")
    public ResponseEntity<List<AlertDto>> getAlerts(@RequestParam(defaultValue = "ALL") String state) {
        return ResponseEntity.ok(observabilityService.getAlerts(state));
    }

    @GetMapping("/escalations")
    public ResponseEntity<List<EscalationDto>> getEscalations() {
        return ResponseEntity.ok(observabilityService.getEscalationHistory());
    }

    @GetMapping("/config")
    public ResponseEntity<MonitoringConfigDto> getConfiguration() {
        return ResponseEntity.ok(observabilityService.getConfiguration());
    }

    @PutMapping("/config")
    public ResponseEntity<MonitoringConfigDto> updateConfiguration(@RequestBody MonitoringConfigDto request) {
        return ResponseEntity.ok(observabilityService.updateConfiguration(request));
    }

    @PostMapping("/reset-baseline")
    public ResponseEntity<Map<String, String>> resetStaleBaseline() {
        observabilityService.resetStaleIncidentsAndAlerts();
        return ResponseEntity.ok(Map.of("message", "Stale incidents and active alerts reset successfully."));
    }
}
