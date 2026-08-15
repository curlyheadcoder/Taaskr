package com.taaskr.service.impl;

import com.taaskr.dto.service.CategoryResponse;
import com.taaskr.dto.service.ServiceResponse;
import com.taaskr.entity.Service;
import com.taaskr.entity.ServiceCategory;
import com.taaskr.exception.ResourceNotFoundException;
import com.taaskr.repository.ServiceCategoryRepository;
import com.taaskr.repository.ServiceRepository;
import com.taaskr.service.CatalogService;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class CatalogServiceImpl implements CatalogService {

    private final ServiceCategoryRepository categoryRepository;
    private final ServiceRepository serviceRepository;

    public CatalogServiceImpl(ServiceCategoryRepository categoryRepository,
                              ServiceRepository serviceRepository) {
        this.categoryRepository = categoryRepository;
        this.serviceRepository = serviceRepository;
    }

    @Override
    public List<CategoryResponse> getAllActiveCategories() {
        return categoryRepository.findByActiveTrueOrderByNameAsc()
                .stream()
                .map(this::mapCategory)
                .toList();
    }

    @Override
    public List<ServiceResponse> getAllActiveServices(Long categoryId) {
        List<Service> services;

        if (categoryId != null) {
            services = serviceRepository.findByCategoryIdAndActiveTrueOrderByNameAsc(categoryId);
        } else {
            services = serviceRepository.findByActiveTrueOrderByNameAsc();
        }

        return services.stream()
                .map(this::mapService)
                .toList();
    }

    @Override
    public ServiceResponse getServiceById(Long serviceId) {
        Service service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new ResourceNotFoundException("Service not found with id: " + serviceId));

        return mapService(service);
    }

    private CategoryResponse mapCategory(ServiceCategory category) {
        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getDescription(),
                category.getActive()
        );
    }

    private ServiceResponse mapService(Service service) {
        return new ServiceResponse(
                service.getId(),
                service.getName(),
                service.getDescription(),
                service.getPrice(),
                service.getDurationMinutes(),
                service.getCategory().getId(),
                service.getCategory().getName(),
                service.getActive()
        );
    }
}