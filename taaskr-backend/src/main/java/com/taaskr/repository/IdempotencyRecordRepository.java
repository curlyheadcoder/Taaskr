package com.taaskr.repository;

import com.taaskr.entity.IdempotencyRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface IdempotencyRecordRepository extends JpaRepository<IdempotencyRecord, Long> {

    Optional<IdempotencyRecord> findByUserIdAndOperationAndIdempotencyKey(Long userId, String operation, String idempotencyKey);

    void deleteByExpiresAtBefore(LocalDateTime now);
}
