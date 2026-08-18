package com.taaskr.controller;

import com.taaskr.dto.booking.BookingResponse;
import com.taaskr.dto.booking.CreateBookingRequest;
import com.taaskr.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import java.time.LocalDate;
import java.time.LocalTime;
import com.taaskr.dto.booking.AvailableProviderResponse;

@RestController
@RequestMapping("/api/bookings")
@PreAuthorize("hasRole('USER')")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping
    public BookingResponse createBooking(@Valid @RequestBody CreateBookingRequest request, Authentication authentication){
        return bookingService.createBooking(authentication.getName(), request);
    }
    @GetMapping("/my")
    public List<BookingResponse> getMyBookings(Authentication authentication){
        return bookingService.getMyBookings(authentication.getName());
    }
    @GetMapping("/{bookingId}")
    public BookingResponse getMyBookingById(@PathVariable Long bookingId, Authentication authentication){
        return bookingService.getMyBookingById(authentication.getName(), bookingId);
    }

    @GetMapping("/available-providers")
    public List<AvailableProviderResponse> getAvailableProviders(
            @RequestParam Long serviceId,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String pincode,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime startTime) {
        return bookingService.getAvailableProviders(serviceId, city, pincode, date, startTime);
    }
}
