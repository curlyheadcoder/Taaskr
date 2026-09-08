package com.taaskr.repository;

import com.taaskr.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    Optional<Review> findByBookingId(Long bookingId);
    List<Review> findByProviderIdOrderByCreatedAtDesc(Long providerId);
    org.springframework.data.domain.Page<Review> findByProviderId(Long providerId, org.springframework.data.domain.Pageable pageable);
    List<Review> findByServiceIdOrderByCreatedAtDesc(Long serviceId);
    org.springframework.data.domain.Page<Review> findByServiceId(Long serviceId, org.springframework.data.domain.Pageable pageable);
    List<Review> findByUserIdOrderByCreatedAtDesc(Long userId);
    boolean existsByBookingId(Long bookingId);
}
