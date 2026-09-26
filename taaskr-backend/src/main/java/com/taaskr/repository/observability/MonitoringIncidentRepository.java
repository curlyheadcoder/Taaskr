package com.taaskr.repository.observability;

import com.taaskr.entity.observability.IncidentStatus;
import com.taaskr.entity.observability.MonitoringIncident;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MonitoringIncidentRepository extends JpaRepository<MonitoringIncident, Long> {

    List<MonitoringIncident> findByStatusIn(List<IncidentStatus> statuses);

    Optional<MonitoringIncident> findByEndpointIdAndStatusIn(Long endpointId, List<IncidentStatus> statuses);

    long countByStatus(IncidentStatus status);

    List<MonitoringIncident> findTop50ByOrderByStartedAtDesc();

    List<MonitoringIncident> findByEndpointId(Long endpointId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @org.springframework.data.jpa.repository.Query("DELETE FROM MonitoringIncident i WHERE i.endpoint.id = :endpointId")
    void deleteByEndpointId(Long endpointId);
}
