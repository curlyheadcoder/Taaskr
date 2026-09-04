package com.taaskr.service;

import com.taaskr.dto.booking.AvailableProviderResponse;
import com.taaskr.dto.booking.BookingResponse;
import com.taaskr.dto.booking.CreateBookingRequest;
import com.taaskr.dto.booking.RateBookingRequest;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface BookingService {
    BookingResponse createBooking(String userEmail, CreateBookingRequest request);
    List<BookingResponse> getMyBookings(String userEmail);
    BookingResponse getMyBookingById(String userEmail, Long bookingId);
    BookingResponse rateBooking(String userEmail, Long bookingId, RateBookingRequest request);
    BookingResponse cancelMyBooking(String userEmail, Long bookingId, String reason);
    List<AvailableProviderResponse> getAvailableProviders(Long serviceId, String city, String pincode, LocalDate date, LocalTime startTime);
}
