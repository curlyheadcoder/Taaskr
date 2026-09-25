package com.taaskr.repository.observability;

import com.taaskr.entity.observability.AlertEscalation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlertEscalationRepository extends JpaRepository<AlertEscalation, Long> {

    List<AlertEscalation> findByIncidentIdOrderByTriggeredAtAsc(Long incidentId);

    List<AlertEscalation> findTop50ByOrderByTriggeredAtDesc();
}
