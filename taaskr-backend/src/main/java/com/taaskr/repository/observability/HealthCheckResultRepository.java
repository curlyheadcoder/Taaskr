package com.taaskr.repository.observability;

import com.taaskr.entity.observability.HealthCheckResult;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface HealthCheckResultRepository extends JpaRepository<HealthCheckResult, Long> {

    List<HealthCheckResult> findByEndpointIdOrderByCheckedAtDesc(Long endpointId, Pageable pageable);

    List<HealthCheckResult> findByCheckedAtAfter(LocalDateTime since);

    @Query("SELECT AVG(r.responseTimeMs) FROM HealthCheckResult r WHERE r.endpoint.id = :endpointId AND r.checkedAt >= :since")
    Double findAverageResponseTimeMs(Long endpointId, LocalDateTime since);

    @Query("SELECT AVG(r.responseTimeMs) FROM HealthCheckResult r WHERE r.checkedAt >= :since")
    Double findGlobalAverageResponseTimeMs(LocalDateTime since);

    @Query("SELECT COUNT(r) FROM HealthCheckResult r WHERE r.checkedAt >= :since AND r.success = true")
    long countSuccessfulChecksSince(LocalDateTime since);

    @Query("SELECT COUNT(r) FROM HealthCheckResult r WHERE r.checkedAt >= :since")
    long countTotalChecksSince(LocalDateTime since);

    @Modifying
    @Transactional
    @Query("DELETE FROM HealthCheckResult r WHERE r.checkedAt < :before")
    int deleteByCheckedAtBefore(LocalDateTime before);
}
