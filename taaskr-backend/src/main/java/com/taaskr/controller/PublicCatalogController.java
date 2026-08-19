package com.taaskr.controller;

import com.taaskr.dto.service.CategoryResponse;
import com.taaskr.dto.service.ServiceResponse;
import com.taaskr.service.CatalogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class PublicCatalogController {

    private final CatalogService catalogService;

    @Autowired
    public PublicCatalogController(CatalogService catalogService) {
        this.catalogService = catalogService;
    }

    @GetMapping("/categories")
    public List<CategoryResponse> getAllCategories() {
        return catalogService.getAllActiveCategories();
    }

    @GetMapping("/services")
    public List<ServiceResponse> getServices(@RequestParam(required = false) Long categoryId) {
        return catalogService.getAllActiveServices(categoryId);
    }

    @GetMapping("/services/{serviceId}")
    public ServiceResponse getServiceById(@PathVariable Long serviceId) {
        return catalogService.getServiceById(serviceId);
    }
}
