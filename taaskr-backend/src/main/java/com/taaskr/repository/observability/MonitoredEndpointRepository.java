package com.taaskr.repository.observability;

import com.taaskr.entity.observability.EndpointHealthState;
import com.taaskr.entity.observability.MonitoredEndpoint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MonitoredEndpointRepository extends JpaRepository<MonitoredEndpoint, Long> {

    List<MonitoredEndpoint> findByEnabledTrue();

    Optional<MonitoredEndpoint> findByUrlPathAndHttpMethod(String urlPath, String httpMethod);

    long countByCurrentState(EndpointHealthState state);

    @Query("SELECT COUNT(e) FROM MonitoredEndpoint e WHERE e.currentState IN (com.taaskr.entity.observability.EndpointHealthState.UNHEALTHY, com.taaskr.entity.observability.EndpointHealthState.DEGRADED)")
    long countDegradedOrUnhealthy();
}
