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
@PreAuthorize("hasAnyRole('USER', 'PROVIDER', 'ADMIN')")
public class BookingController {

    private final BookingService bookingService;
    private final com.taaskr.service.InvoicePdfService invoicePdfService;

    public BookingController(BookingService bookingService, com.taaskr.service.InvoicePdfService invoicePdfService) {
        this.bookingService = bookingService;
        this.invoicePdfService = invoicePdfService;
    }

    @PostMapping
    public BookingResponse createBooking(@Valid @RequestBody CreateBookingRequest request, Authentication authentication){
        return bookingService.createBooking(authentication.getName(), request);
    }
    @GetMapping("/my")
    public List<BookingResponse> getMyBookings(Authentication authentication){
        return bookingService.getMyBookings(authentication.getName());
    }

    @GetMapping("/my/page")
    public com.taaskr.dto.common.PageResponse<BookingResponse> getMyBookingsPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication){
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));
        return bookingService.getMyBookings(authentication.getName(), pageable);
    }

    @GetMapping("/{bookingId}")
    public BookingResponse getMyBookingById(@PathVariable Long bookingId, Authentication authentication){
        return bookingService.getMyBookingById(authentication.getName(), bookingId);
    }

    @GetMapping("/{bookingId}/invoice")
    public org.springframework.http.ResponseEntity<byte[]> downloadInvoice(@PathVariable Long bookingId, Authentication authentication) {
        byte[] pdfBytes = invoicePdfService.generateInvoicePdf(bookingId, authentication.getName());
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_PDF);
        headers.setContentDisposition(org.springframework.http.ContentDisposition.inline().filename("Taaskr_Invoice_" + bookingId + ".pdf").build());
        return new org.springframework.http.ResponseEntity<>(pdfBytes, headers, org.springframework.http.HttpStatus.OK);
    }

    @PostMapping("/{bookingId}/rate")
    public BookingResponse rateBooking(@PathVariable Long bookingId, 
                                       @Valid @RequestBody com.taaskr.dto.booking.RateBookingRequest request, 
                                       Authentication authentication) {
        return bookingService.rateBooking(authentication.getName(), bookingId, request);
    }

    @PostMapping("/{bookingId}/cancel")
    public BookingResponse cancelBooking(@PathVariable Long bookingId,
                                         @RequestBody(required = false) java.util.Map<String, String> body,
                                         Authentication authentication) {
        String reason = body != null ? body.get("reason") : null;
        return bookingService.cancelMyBooking(authentication.getName(), bookingId, reason);
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
