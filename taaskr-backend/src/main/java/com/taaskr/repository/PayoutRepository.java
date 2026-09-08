package com.taaskr.repository;

import com.taaskr.entity.Payout;
import com.taaskr.enums.PayoutStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PayoutRepository extends JpaRepository<Payout, Long> {
    List<Payout> findByProviderIdOrderByRequestedAtDesc(Long providerId);
    List<Payout> findByStatusOrderByRequestedAtDesc(PayoutStatus status);
    List<Payout> findAllByOrderByRequestedAtDesc();
    Optional<Payout> findByIdAndProviderId(Long id, Long providerId);
}
