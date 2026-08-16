package com.taaskr.service;

import com.taaskr.dto.booking.BookingResponse;
import com.taaskr.dto.booking.CreateBookingRequest;

import java.util.List;

public interface BookingService {
    BookingResponse createBooking(String userEmail, CreateBookingRequest request);
    List<BookingResponse> getMyBookings(String userEmail);
    BookingResponse getMyBookingById(String userEmail, Long bookingId);
}
