package com.taaskr.repository;

import com.taaskr.entity.Dispute;
import com.taaskr.enums.DisputeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DisputeRepository extends JpaRepository<Dispute, Long> {
    List<Dispute> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Dispute> findByProviderIdOrderByCreatedAtDesc(Long providerId);
    List<Dispute> findByStatusOrderByCreatedAtDesc(DisputeStatus status);
    List<Dispute> findAllByOrderByCreatedAtDesc();
    Optional<Dispute> findByBookingId(Long bookingId);
}
