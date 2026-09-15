package com.taaskr.controller;

import com.taaskr.dto.booking.BookingResponse;
import com.taaskr.dto.partner.UpdatePartnerLocationRequest;
import com.taaskr.enums.PaymentMethod;
import com.taaskr.service.ServicePartnerService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/partner")
public class PartnerController {

    private final ServicePartnerService servicePartnerService;

    public PartnerController(ServicePartnerService servicePartnerService) {
        this.servicePartnerService = servicePartnerService;
    }

    @GetMapping("/profile")
    public com.taaskr.dto.partner.ServicePartnerResponse getProfile(Authentication authentication) {
        return servicePartnerService.getPartnerProfile(authentication.getName());
    }

    @GetMapping("/tasks")
    public List<BookingResponse> getMyTasks(Authentication authentication) {
        return servicePartnerService.getPartnerAssignedTasks(authentication.getName());
    }

    @PutMapping("/tasks/{bookingId}/accept")
    public BookingResponse acceptTask(@PathVariable Long bookingId,
                                      Authentication authentication) {
        return servicePartnerService.acceptTaskByPartner(authentication.getName(), bookingId);
    }

    @PutMapping("/tasks/{bookingId}/start-journey")
    public BookingResponse startJourney(@PathVariable Long bookingId,
                                         Authentication authentication) {
        return servicePartnerService.startJourneyByPartner(authentication.getName(), bookingId);
    }

    @PostMapping("/location")
    public void updateLocation(@Valid @RequestBody UpdatePartnerLocationRequest request,
                               Authentication authentication) {
        servicePartnerService.updatePartnerLocation(authentication.getName(), request);
    }

    @PutMapping("/tasks/{bookingId}/arrived")
    public BookingResponse markArrived(@PathVariable Long bookingId,
                                       Authentication authentication) {
        return servicePartnerService.markArrivedByPartner(authentication.getName(), bookingId);
    }

    @PutMapping("/tasks/{bookingId}/start-work")
    public BookingResponse startWork(@PathVariable Long bookingId,
                                     Authentication authentication) {
        return servicePartnerService.startWorkByPartner(authentication.getName(), bookingId);
    }

    @PutMapping("/tasks/{bookingId}/complete-work")
    public BookingResponse completeWork(@PathVariable Long bookingId,
                                        Authentication authentication) {
        return servicePartnerService.completeWorkByPartner(authentication.getName(), bookingId);
    }

    @PutMapping("/tasks/{bookingId}/record-payment")
    public BookingResponse recordPayment(@PathVariable Long bookingId,
                                         @RequestParam(required = false, defaultValue = "AFTER_SERVICE") PaymentMethod paymentMethod,
                                         Authentication authentication) {
        return servicePartnerService.recordPaymentByPartner(authentication.getName(), bookingId, paymentMethod);
    }
}
