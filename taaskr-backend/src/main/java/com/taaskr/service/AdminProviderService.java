package com.taaskr.service;

import com.taaskr.dto.admin.AdminProviderResponse;
import com.taaskr.dto.common.PageResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface AdminProviderService {
    List<AdminProviderResponse> getAllProviders();
    PageResponse<AdminProviderResponse> getAllProviders(Pageable pageable);
    AdminProviderResponse approveProvider(Long providerId);
    AdminProviderResponse updateProviderRemarks(Long providerId, String remarks);
}
