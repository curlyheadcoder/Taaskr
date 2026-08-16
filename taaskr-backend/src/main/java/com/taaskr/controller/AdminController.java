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

    public AdminController(AdminCatalogService adminCatalogService,
                           AdminUserService adminUserService,
                           AdminProviderService adminProviderService,
                           AdminBookingService adminBookingService) {
        this.adminCatalogService = adminCatalogService;
        this.adminUserService = adminUserService;
        this.adminProviderService = adminProviderService;
        this.adminBookingService = adminBookingService;
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
    @GetMapping("/bookings")
    public List<AdminBookingResponse> getAllBookings() {
        return adminBookingService.getAllBookings();
    }

}
