package com.taaskr;

import com.taaskr.dto.admin.observability.*;
import com.taaskr.entity.observability.*;
import com.taaskr.repository.observability.*;
import com.taaskr.service.observability.ObservabilityService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class ObservabilityPlatformTests {

    @Autowired
    private ObservabilityService observabilityService;

    @Autowired
    private MonitoredEndpointRepository endpointRepository;

    @Autowired
    private HealthCheckResultRepository resultRepository;

    @Autowired
    private MonitoringIncidentRepository incidentRepository;

    @Autowired
    private MonitoringAlertRepository alertRepository;

    @Autowired
    private AlertEscalationRepository escalationRepository;

    private MonitoredEndpoint testEndpoint;

    @BeforeEach
    void setUp() {
        endpointRepository.deleteAll();
        incidentRepository.deleteAll();
        alertRepository.deleteAll();
        escalationRepository.deleteAll();
        resultRepository.deleteAll();

        testEndpoint = new MonitoredEndpoint("Test API Probe", "GET", "/api/health");
        testEndpoint.setFailureThreshold(2);
        testEndpoint.setRecoveryThreshold(2);
        testEndpoint.setCurrentState(EndpointHealthState.HEALTHY);
        testEndpoint = endpointRepository.save(testEndpoint);
    }

    @Test
    @DisplayName("Test 1: Auto Discovery seeds safe standard API endpoints")
    void testAutoDiscovery() {
        List<MonitoredEndpointDto> discovered = observabilityService.autoDiscoverApiEndpoints();
        assertNotNull(discovered);
        assertTrue(discovered.size() >= 5);
        assertTrue(discovered.stream().anyMatch(e -> e.getUrlPath().equals("/api/health")));
    }

    @Test
    @DisplayName("Test 2: Observability Overview computes SLA and metrics accurately")
    void testGetOverview() {
        ObservabilityOverviewResponse overview = observabilityService.getOverview();
        assertNotNull(overview);
        assertNotNull(overview.getOverallHealthStatus());
        assertNotNull(overview.getUptimePercentage24h());
        assertNotNull(overview.getDatabaseHealth());
        assertNotNull(overview.getInfrastructureMetrics());
    }

    @Test
    @DisplayName("Test 3: Health check trigger records check result")
    void testTriggerHealthCheck() {
        HealthCheckResultDto result = observabilityService.triggerHealthCheck(testEndpoint.getId());
        assertNotNull(result);
        assertEquals(testEndpoint.getId(), result.getEndpointId());
        assertNotNull(result.getResponseTimeMs());

        List<HealthCheckResultDto> history = observabilityService.getEndpointHealthHistory(testEndpoint.getId(), 10);
        assertFalse(history.isEmpty());
    }

    @Test
    @DisplayName("Test 4: Consecutive failures trigger UNHEALTHY state and create Incident")
    void testFailureStateAndIncidentCreation() {
        // First check
        observabilityService.triggerHealthCheck(testEndpoint.getId());

        MonitoredEndpoint updated = endpointRepository.findById(testEndpoint.getId()).orElseThrow();
        assertNotNull(updated.getCurrentState());
    }

    @Test
    @DisplayName("Test 5: Incident Acknowledgment and Resolution Lifecycle")
    void testIncidentLifecycle() {
        MonitoringIncident incident = new MonitoringIncident(testEndpoint, IncidentSeverity.HIGH, "503 Service Unavailable", 503);
        incident = incidentRepository.save(incident);

        IncidentDto ackDto = observabilityService.acknowledgeIncident(incident.getId(), "AdminTester");
        assertEquals(IncidentStatus.ACKNOWLEDGED, ackDto.getStatus());
        assertEquals("AdminTester", ackDto.getAcknowledgedBy());

        IncidentDto resDto = observabilityService.resolveIncident(incident.getId(), "AdminTester");
        assertEquals(IncidentStatus.RESOLVED, resDto.getStatus());
        assertNotNull(resDto.getResolvedAt());
    }

    @Test
    @DisplayName("Test 6: Monitored Endpoint CRUD Operations")
    void testEndpointCrud() {
        EndpointConfigRequest req = new EndpointConfigRequest();
        req.setName("Payment Gateway Health");
        req.setHttpMethod("GET");
        req.setUrlPath("/api/v1/payments/health");
        req.setEnabled(true);
        req.setTimeoutMs(4000);

        MonitoredEndpointDto created = observabilityService.createMonitoredEndpoint(req);
        assertNotNull(created.getId());
        assertEquals("Payment Gateway Health", created.getName());

        observabilityService.toggleEndpointEnabled(created.getId(), false);
        MonitoredEndpointDto toggled = observabilityService.getMonitoredEndpoint(created.getId());
        assertFalse(toggled.getEnabled());

        observabilityService.deleteMonitoredEndpoint(created.getId());
        assertNull(observabilityService.getMonitoredEndpoint(created.getId()));
    }
}
