package com.taaskr.service;

import com.taaskr.dto.booking.AvailableProviderResponse;
import com.taaskr.dto.booking.BookingResponse;
import com.taaskr.dto.booking.CreateBookingRequest;
import com.taaskr.dto.booking.RateBookingRequest;
import com.taaskr.dto.common.PageResponse;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface BookingService {
    BookingResponse createBooking(String userEmail, CreateBookingRequest request);
    List<BookingResponse> getMyBookings(String userEmail);
    PageResponse<BookingResponse> getMyBookings(String userEmail, Pageable pageable);
    BookingResponse getMyBookingById(String userEmail, Long bookingId);
    BookingResponse rateBooking(String userEmail, Long bookingId, RateBookingRequest request);
    BookingResponse cancelMyBooking(String userEmail, Long bookingId, String reason);
    List<AvailableProviderResponse> getAvailableProviders(Long serviceId, String city, String pincode, LocalDate date, LocalTime startTime);
}
