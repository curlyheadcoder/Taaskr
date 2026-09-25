package com.taaskr.repository.observability;

import com.taaskr.entity.observability.MonitoringConfiguration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MonitoringConfigurationRepository extends JpaRepository<MonitoringConfiguration, Long> {
}
