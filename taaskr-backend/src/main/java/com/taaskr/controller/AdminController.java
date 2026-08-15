package com.taaskr.controller;

import com.taaskr.dto.service.CategoryRequest;
import com.taaskr.dto.service.CategoryResponse;
import com.taaskr.dto.service.ServiceRequest;
import com.taaskr.dto.service.ServiceResponse;
import com.taaskr.service.AdminCatalogService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminCatalogService adminCatalogService;

    public AdminController(AdminCatalogService adminCatalogService) {
        this.adminCatalogService = adminCatalogService;
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
}
