package com.taaskr.controller;

import com.taaskr.dto.discussion.CreateDiscussionRequest;
import com.taaskr.dto.discussion.DiscussionResponse;
import com.taaskr.dto.discussion.ReplyDiscussionRequest;
import com.taaskr.dto.provider.*;
import com.taaskr.dto.service.CategoryResponse;
import com.taaskr.service.PartnerDiscussionService;
import com.taaskr.service.ProviderWorkflowService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/provider")
public class ProviderController {

    private final ProviderWorkflowService providerWorkflowService;
    private final PartnerDiscussionService partnerDiscussionService;

    public ProviderController(ProviderWorkflowService providerWorkflowService,
                              PartnerDiscussionService partnerDiscussionService) {
        this.providerWorkflowService = providerWorkflowService;
        this.partnerDiscussionService = partnerDiscussionService;
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

    @GetMapping("/available-tasks")
    public List<ProviderBookingResponse> getAvailableTasks(Authentication authentication) {
        return providerWorkflowService.getAvailableTasks(authentication.getName());
    }

    @PutMapping("/bookings/{bookingId}/claim")
    public ProviderBookingResponse claimTask(@PathVariable Long bookingId,
                                             Authentication authentication) {
        return providerWorkflowService.claimTask(authentication.getName(), bookingId);
    }

    @PutMapping("/bookings/{bookingId}/status")
    public ProviderBookingResponse updateBookingStatus(@PathVariable Long bookingId,
                                                       @Valid @RequestBody UpdateProviderBookingStatusRequest request,
                                                       Authentication authentication) {
        return providerWorkflowService.updateBookingStatus(authentication.getName(), bookingId, request);
    }

    @PutMapping("/bookings/{bookingId}/reject")
    public ProviderBookingResponse rejectBooking(@PathVariable Long bookingId,
                                                 Authentication authentication) {
        return providerWorkflowService.rejectBooking(authentication.getName(), bookingId);
    }

    @PutMapping("/bookings/{bookingId}/payment-received")
    public ProviderBookingResponse markAfterServicePaymentReceived(@PathVariable Long bookingId,
                                                                    Authentication authentication) {
        return providerWorkflowService.markAfterServicePaymentReceived(authentication.getName(), bookingId);
    }

    @GetMapping("/profile")
    public ProviderProfileResponse getProviderProfile(Authentication authentication) {
        return providerWorkflowService.getProviderProfile(authentication.getName());
    }

    @PutMapping("/profile")
    public ProviderProfileResponse updateProviderProfile(@Valid @RequestBody UpdateProviderProfileRequest request,
                                                         Authentication authentication) {
        return providerWorkflowService.updateProviderProfile(authentication.getName(), request);
    }

    @GetMapping("/categories")
    public List<CategoryResponse> getMyCategories(Authentication authentication) {
        return providerWorkflowService.getMyCategories(authentication.getName());
    }

    @PutMapping("/categories")
    public List<CategoryResponse> updateMyCategories(@Valid @RequestBody UpdateProviderCategoriesRequest request,
                                                     Authentication authentication) {
        return providerWorkflowService.updateMyCategories(authentication.getName(), request);
    }

    // ----------------------------------------
    // PARTNER DISCUSSION & ADMIN CONNECT
    // ----------------------------------------
    @PostMapping("/discussions")
    public DiscussionResponse createDiscussion(@Valid @RequestBody CreateDiscussionRequest request,
                                               Authentication authentication) {
        return partnerDiscussionService.createDiscussion(authentication.getName(), request);
    }

    @GetMapping("/discussions")
    public List<DiscussionResponse> getMyDiscussions(Authentication authentication) {
        return partnerDiscussionService.getProviderDiscussions(authentication.getName());
    }

    @GetMapping("/discussions/{discussionId}")
    public DiscussionResponse getDiscussionById(@PathVariable Long discussionId,
                                                Authentication authentication) {
        return partnerDiscussionService.getDiscussionByIdForProvider(authentication.getName(), discussionId);
    }

    @PostMapping("/discussions/{discussionId}/reply")
    public DiscussionResponse replyDiscussion(@PathVariable Long discussionId,
                                              @Valid @RequestBody ReplyDiscussionRequest request,
                                              Authentication authentication) {
        return partnerDiscussionService.replyDiscussionByProvider(authentication.getName(), discussionId, request);
    }
}
