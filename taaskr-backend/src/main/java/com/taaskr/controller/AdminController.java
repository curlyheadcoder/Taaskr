package com.taaskr.controller;

import com.taaskr.dto.admin.AdminBookingResponse;
import com.taaskr.dto.admin.AdminProviderResponse;
import com.taaskr.dto.admin.AdminUserResponse;
import com.taaskr.dto.service.CategoryRequest;
import com.taaskr.dto.service.CategoryResponse;
import com.taaskr.dto.service.ServiceRequest;
import com.taaskr.dto.service.ServiceResponse;
import com.taaskr.service.AdminBookingService;
import com.taaskr.service.AdminCatalogService;
import com.taaskr.service.AdminProviderService;
import com.taaskr.service.AdminUserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminCatalogService adminCatalogService;

    private final AdminUserService adminUserService;

    private final AdminProviderService adminProviderService;

    private final AdminBookingService adminBookingService;

    private final com.taaskr.service.PartnerDiscussionService partnerDiscussionService;

    public AdminController(AdminCatalogService adminCatalogService,
                           AdminUserService adminUserService,
                           AdminProviderService adminProviderService,
                           AdminBookingService adminBookingService,
                           com.taaskr.service.PartnerDiscussionService partnerDiscussionService) {
        this.adminCatalogService = adminCatalogService;
        this.adminUserService = adminUserService;
        this.adminProviderService = adminProviderService;
        this.adminBookingService = adminBookingService;
        this.partnerDiscussionService = partnerDiscussionService;
    }

    @PostMapping("/categories")
    public CategoryResponse createCategory(@Valid @RequestBody CategoryRequest request){
        return adminCatalogService.createCategory(request);
    }

    @PutMapping("/categories/{categoryId}")
    public CategoryResponse updateCategory(@PathVariable Long categoryId,
                                           @Valid @RequestBody CategoryRequest request){
        return adminCatalogService.updateCategory(categoryId, request);
    }

    @PostMapping("/services")
    public ServiceResponse createService(@Valid @RequestBody ServiceRequest request){
        return adminCatalogService.createService(request);
    }

    @PutMapping("/services/{serviceId}")
    public ServiceResponse updateService(@PathVariable Long serviceId,
                                         @Valid @RequestBody ServiceRequest request){
        return adminCatalogService.updateService(serviceId, request);
    }

    @DeleteMapping("/services/{serviceId}")
    public ResponseEntity<Void> deleteService(@PathVariable Long serviceId){
        adminCatalogService.deleteService(serviceId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/users")
    public List<AdminUserResponse> getAllUsers(){
        return adminUserService.getAllUsers();
    }

    @GetMapping("/providers")
    public List<AdminProviderResponse> getAllProviders(){
        return adminProviderService.getAllProviders();
    }

    @PutMapping("/providers/{providerId}/approve")
    public AdminProviderResponse approveProvider(
            @PathVariable Long providerId) {

        return adminProviderService.approveProvider(providerId);
    }

    @PutMapping("/providers/{providerId}/remarks")
    public AdminProviderResponse updateProviderRemarks(
            @PathVariable Long providerId,
            @Valid @RequestBody com.taaskr.dto.admin.UpdateProviderRemarksRequest request) {

        return adminProviderService.updateProviderRemarks(providerId, request.getRemarks());
    }

    @GetMapping("/bookings")
    public List<AdminBookingResponse> getAllBookings() {
        return adminBookingService.getAllBookings();
    }

    // ----------------------------------------
    // PARTNER DISCUSSIONS & DESK
    // ----------------------------------------
    @GetMapping("/discussions")
    public List<com.taaskr.dto.discussion.DiscussionResponse> getAllDiscussions(@RequestParam(required = false) com.taaskr.enums.DiscussionStatus status) {
        return partnerDiscussionService.getAllDiscussionsForAdmin(status);
    }

    @GetMapping("/discussions/{discussionId}")
    public com.taaskr.dto.discussion.DiscussionResponse getDiscussionById(@PathVariable Long discussionId) {
        return partnerDiscussionService.getDiscussionByIdForAdmin(discussionId);
    }

    @PostMapping("/discussions/{discussionId}/reply")
    public com.taaskr.dto.discussion.DiscussionResponse replyDiscussion(@PathVariable Long discussionId,
                                                                        @Valid @RequestBody com.taaskr.dto.discussion.ReplyDiscussionRequest request,
                                                                        org.springframework.security.core.Authentication authentication) {
        return partnerDiscussionService.replyDiscussionByAdmin(authentication.getName(), discussionId, request);
    }

    @PutMapping("/discussions/{discussionId}/status")
    public com.taaskr.dto.discussion.DiscussionResponse updateDiscussionStatus(@PathVariable Long discussionId,
                                                                              @Valid @RequestBody com.taaskr.dto.discussion.UpdateDiscussionStatusRequest request) {
        return partnerDiscussionService.updateDiscussionStatus(discussionId, request);
    }
}
