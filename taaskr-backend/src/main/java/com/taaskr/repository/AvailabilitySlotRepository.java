package com.taaskr.repository;

import com.taaskr.entity.AvailabilitySlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AvailabilitySlotRepository extends JpaRepository<AvailabilitySlot, Long> {
    List<AvailabilitySlot> findByProviderIdAndAvailableDateOrderByStartTimeAsc(Long providerId, LocalDate date);

    List<AvailabilitySlot> findByProviderIdAndAvailableDateAndBookedFalseOrderByStartTimeAsc(Long providerId, LocalDate date);

    List<AvailabilitySlot> findByProviderIdOrderByAvailableDateAscStartTimeAsc(Long providerId);

    Optional<AvailabilitySlot> findByIdAndProviderId(Long id, Long providerId);

    boolean existsByProviderIdAndAvailableDateAndStartTimeLessThanAndEndTimeGreaterThan(
            Long providerId,
            LocalDate availableDate,
            LocalTime endTime,
            LocalTime startTime
    );
}
