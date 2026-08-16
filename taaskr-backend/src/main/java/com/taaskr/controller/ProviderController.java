package com.taaskr.controller;


import com.taaskr.dto.provider.AvailabilityResponse;
import com.taaskr.dto.provider.CreateAvailabilityRequest;
import com.taaskr.dto.provider.ProviderBookingResponse;
import com.taaskr.dto.provider.UpdateProviderBookingStatusRequest;
import com.taaskr.service.ProviderWorkflowService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/provider")
public class ProviderController {

    private final ProviderWorkflowService providerWorkflowService;

    public ProviderController(ProviderWorkflowService providerWorkflowService) {
        this.providerWorkflowService = providerWorkflowService;
    }

    @PostMapping("/availability")
    public AvailabilityResponse createAvailability(@Valid @RequestBody CreateAvailabilityRequest request,
                                                   Authentication authentication) {
        return providerWorkflowService.createAvailability(authentication.getName(), request);
    }

    @GetMapping("/availability")
    public List<AvailabilityResponse> getMyAvailability(Authentication authentication) {
        return providerWorkflowService.getMyAvailability(authentication.getName());
    }

    @DeleteMapping("/availability/{availabilityId}")
    public void deleteAvailability(@PathVariable Long availabilityId,
                                   Authentication authentication) {
        providerWorkflowService.deleteAvailability(authentication.getName(), availabilityId);
    }

    @GetMapping("/bookings")
    public List<ProviderBookingResponse> getMyAssignedBookings(Authentication authentication) {
        return providerWorkflowService.getMyAssignedBookings(authentication.getName());
    }

    @PutMapping("/bookings/{bookingId}/accept")
    public ProviderBookingResponse acceptBooking(@PathVariable Long bookingId,
                                                 Authentication authentication) {
        return providerWorkflowService.acceptBooking(authentication.getName(), bookingId);
    }

    @PutMapping("/bookings/{bookingId}/reject")
    public ProviderBookingResponse rejectBooking(@PathVariable Long bookingId,
                                                 Authentication authentication) {
        return providerWorkflowService.rejectBooking(authentication.getName(), bookingId);
    }

    @PutMapping("/bookings/{bookingId}/status")
    public ProviderBookingResponse updateBookingStatus(@PathVariable Long bookingId,
                                                       @Valid @RequestBody UpdateProviderBookingStatusRequest request,
                                                       Authentication authentication) {
        return providerWorkflowService.updateBookingStatus(authentication.getName(), bookingId, request);
    }
}
