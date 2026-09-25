package com.taaskr.repository.observability;

import com.taaskr.entity.observability.AlertState;
import com.taaskr.entity.observability.MonitoringAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MonitoringAlertRepository extends JpaRepository<MonitoringAlert, Long> {

    List<MonitoringAlert> findByState(AlertState state);

    List<MonitoringAlert> findTop50ByOrderByCreatedAtDesc();

    long countByState(AlertState state);

    boolean existsByIncidentIdAndAlertTypeAndState(Long incidentId, String alertType, AlertState state);
}
