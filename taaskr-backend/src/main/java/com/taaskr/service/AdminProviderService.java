package com.taaskr.service;

import com.taaskr.dto.admin.AdminProviderResponse;

import java.util.List;

public interface AdminProviderService {
    List<AdminProviderResponse> getAllProviders();
    AdminProviderResponse approveProvider(Long providerId);
}
