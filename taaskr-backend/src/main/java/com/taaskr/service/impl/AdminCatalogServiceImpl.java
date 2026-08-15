package com.taaskr.service.impl;

import com.taaskr.dto.service.CategoryRequest;
import com.taaskr.dto.service.CategoryResponse;
import com.taaskr.dto.service.ServiceRequest;
import com.taaskr.dto.service.ServiceResponse;
import com.taaskr.entity.Service;
import com.taaskr.entity.ServiceCategory;
import com.taaskr.exception.BadRequestException;
import com.taaskr.exception.ResourceNotFoundException;
import com.taaskr.repository.ServiceCategoryRepository;
import com.taaskr.repository.ServiceRepository;
import com.taaskr.service.AdminCatalogService;
import org.springframework.stereotype.Component;

@Component
public class AdminCatalogServiceImpl implements AdminCatalogService {

    private final ServiceCategoryRepository categoryRepository;
    private final ServiceRepository serviceRepository;

    public AdminCatalogServiceImpl(ServiceCategoryRepository serviceCategoryRepository, ServiceRepository serviceRepository) {
        this.categoryRepository = serviceCategoryRepository;
        this.serviceRepository = serviceRepository;
    }

    @Override
    public CategoryResponse createCategory(CategoryRequest request) {
        categoryRepository.findByNameIgnoreCase(request.getName().trim())
                .ifPresent(existing ->{
                    throw new BadRequestException("Category already exists with name " + request.getName());
                });
        ServiceCategory category = new ServiceCategory();
        category.setName(request.getName().trim());
        category.setDescription(request.getDescription());
        category.setActive(request.getActive() != null ? request.getActive() : true);

        ServiceCategory saved = categoryRepository.save(category);
        return mapCategory(saved);
    }

    @Override
    public CategoryResponse updateCategory(Long categoryId, CategoryRequest request) {
        ServiceCategory category = categoryRepository.findById(categoryId)
                .orElseThrow(()-> new ResourceNotFoundException("Category not found with id " + categoryId));
        category.setName(request.getName().trim());
        category.setDescription(request.getDescription());
        category.setActive(request.getActive() != null ? request.getActive() : category.getActive());

        ServiceCategory saved = categoryRepository.save(category);
        return mapCategory(saved);
    }

    @Override
    public ServiceResponse createService(ServiceRequest request) {
        ServiceCategory category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(()-> new ResourceNotFoundException("Category not found with id " + request.getCategoryId()));
        Service service = new Service();
        service.setName(request.getName().trim());
        service.setDescription(request.getDescription());
        service.setPrice(request.getPrice());
        service.setDurationMinutes(request.getDurationMinutes());
        service.setCategory(category);
        service.setActive(request.getActive() != null ? request.getActive() : true);
        Service saved = serviceRepository.save(service);
        return mapService(saved);
    }

    @Override
    public ServiceResponse updateService(Long serviceId, ServiceRequest request) {
        Service service = serviceRepository.findById(serviceId)
                .orElseThrow(()-> new ResourceNotFoundException("Service not found with id " + serviceId));
        ServiceCategory category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(()-> new ResourceNotFoundException("Category not found with id " + request.getCategoryId()));
        service.setName(request.getName().trim());
        service.setDescription(request.getDescription());
        service.setPrice(request.getPrice());
        service.setDurationMinutes(request.getDurationMinutes());
        service.setCategory(category);
        service.setActive(request.getActive() != null ? request.getActive() : service.getActive());

        Service saved = serviceRepository.save(service);
        return mapService(saved);
    }

    @Override
    public void deleteService(Long serviceId) {
        Service service = serviceRepository.findById(serviceId)
                .orElseThrow(()-> new ResourceNotFoundException("Service not found with id " + serviceId));
        serviceRepository.delete(service);
    }

    private CategoryResponse mapCategory(ServiceCategory category) {
        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getDescription(),
                category.getActive()
        );
    }
    private ServiceResponse mapService(Service service){
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
