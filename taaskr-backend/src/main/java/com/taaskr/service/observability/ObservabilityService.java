package com.taaskr.service.observability;

import com.taaskr.dto.admin.observability.*;
import com.taaskr.entity.observability.IncidentStatus;

import java.util.List;

public interface ObservabilityService {

    ObservabilityOverviewResponse getOverview();

    List<MonitoredEndpointDto> getAllMonitoredEndpoints();

    MonitoredEndpointDto getMonitoredEndpoint(Long id);

    MonitoredEndpointDto createMonitoredEndpoint(EndpointConfigRequest request);

    MonitoredEndpointDto updateMonitoredEndpoint(Long id, EndpointConfigRequest request);

    void toggleEndpointEnabled(Long id, boolean enabled);

    void deleteMonitoredEndpoint(Long id);

    List<MonitoredEndpointDto> autoDiscoverApiEndpoints();

    HealthCheckResultDto triggerHealthCheck(Long endpointId);

    List<HealthCheckResultDto> getEndpointHealthHistory(Long endpointId, int limit);

    List<IncidentDto> getIncidents(List<IncidentStatus> statuses);

    IncidentDto acknowledgeIncident(Long incidentId, String adminUsername);

    IncidentDto resolveIncident(Long incidentId, String adminUsername);

    List<AlertDto> getAlerts(String stateFilter);

    List<EscalationDto> getEscalationHistory();

    MonitoringConfigDto getConfiguration();

    MonitoringConfigDto updateConfiguration(MonitoringConfigDto request);

    int purgeOldHealthCheckResults();

    void resetStaleIncidentsAndAlerts();
}
