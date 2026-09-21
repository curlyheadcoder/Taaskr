package com.taaskr.repository;

import com.taaskr.entity.ServicePartner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ServicePartnerRepository extends JpaRepository<ServicePartner, Long> {

    List<ServicePartner> findByProviderId(Long providerId);

    List<ServicePartner> findByProviderIdAndActiveTrue(Long providerId);

    Optional<ServicePartner> findByUserId(Long userId);

    Optional<ServicePartner> findByIdAndProviderId(Long id, Long providerId);

    @Modifying
    @Query("UPDATE ServicePartner p SET p.currentLatitude = :lat, p.currentLongitude = :lng, p.locationUpdatedAt = :sampleTime WHERE p.id = :id AND (p.locationUpdatedAt IS NULL OR p.locationUpdatedAt < :sampleTime)")
    int updateLocationIfNewer(@Param("id") Long id, @Param("lat") BigDecimal lat, @Param("lng") BigDecimal lng, @Param("sampleTime") LocalDateTime sampleTime);
}
