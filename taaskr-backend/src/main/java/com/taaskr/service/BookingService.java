package com.taaskr.service;

import com.taaskr.dto.booking.BookingResponse;
import com.taaskr.dto.booking.CreateBookingRequest;

import java.util.List;

import com.taaskr.dto.booking.AvailableProviderResponse;
import java.time.LocalDate;
import java.time.LocalTime;

public interface BookingService {
    BookingResponse createBooking(String userEmail, CreateBookingRequest request);
    List<BookingResponse> getMyBookings(String userEmail);
    BookingResponse getMyBookingById(String userEmail, Long bookingId);
    List<AvailableProviderResponse> getAvailableProviders(Long serviceId, String city, String pincode, LocalDate date, LocalTime startTime);
}
