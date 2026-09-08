package com.taaskr.repository;

import com.taaskr.entity.WalletTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, Long> {
    List<WalletTransaction> findByProviderIdOrderByCreatedAtDesc(Long providerId);
    boolean existsByBookingIdAndType(Long bookingId, com.taaskr.enums.WalletTransactionType type);
}
