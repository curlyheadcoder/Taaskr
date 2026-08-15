package com.taaskr.service;

import com.taaskr.dto.service.CategoryResponse;
import com.taaskr.dto.service.ServiceResponse;

import java.util.List;

public interface CatalogService {
    List<CategoryResponse> getAllActiveCategories();
    List<ServiceResponse> getAllActiveServices(Long categoryId);
    ServiceResponse getServiceById(Long serviceId);
}
