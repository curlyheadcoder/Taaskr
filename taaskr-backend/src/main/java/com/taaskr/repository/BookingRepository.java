package com.taaskr.repository;

import com.taaskr.entity.Booking;
import com.taaskr.enums.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Booking> findByProviderIdOrderByCreatedAtDesc(Long providerId);

    Optional<Booking> findByIdAndUserId(Long bookingId, Long userId);

    Optional<Booking> findByIdAndProviderId(Long bookingId, Long providerId);

    long countByProviderIdAndStatusIn(Long providerId, List<BookingStatus> statuses);

    List<Booking> findAllByOrderByCreatedAtDesc();

    boolean existsByProviderIdAndBookingDateAndStartTimeLessThanAndEndTimeGreaterThan(
            Long providerId,
            LocalDate bookingDate,
            LocalTime endTime,
            LocalTime startTime
    );

    List<Booking> findByStatusAndCityAndServiceIdInOrderByCreatedAtDesc(BookingStatus status, String city, List<Long> serviceIds);
}
