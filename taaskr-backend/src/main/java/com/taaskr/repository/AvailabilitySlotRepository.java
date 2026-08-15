package com.taaskr.repository;

import com.taaskr.entity.AvailabilitySlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
@Repository
public interface AvailabilitySlotRepository extends JpaRepository<AvailabilitySlot, Long> {
    List<AvailabilitySlot> findByProviderIdAndAvailableDateOrderByStartTimeAsc(Long provideId, LocalDate date);

    List<AvailabilitySlot> findByProviderIdAndAvailableDateAndBookedFalseOrderByStartTimeAsc(Long providerId, LocalDate date);

    boolean existsByProviderIdAndAvailableDateAndStartTimeLessThanAndEndTimeGreaterThan(
            Long providerId,
            LocalDate availableDate,
            LocalTime endTime,
            LocalTime startTime
    );
}
