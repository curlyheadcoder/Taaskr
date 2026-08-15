package com.taaskr.service;

import com.taaskr.dto.service.CategoryRequest;
import com.taaskr.dto.service.CategoryResponse;
import com.taaskr.dto.service.ServiceRequest;
import com.taaskr.dto.service.ServiceResponse;

public interface AdminCatalogService {

    CategoryResponse createCategory(CategoryRequest request);

    CategoryResponse updateCategory(Long categoryId, CategoryRequest request);

    ServiceResponse createService(ServiceRequest request);

    ServiceResponse updateService(Long serviceId, ServiceRequest request);

    void deleteService(Long serviceId);
}
