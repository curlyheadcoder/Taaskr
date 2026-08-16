package com.taaskr.service.impl;

import com.taaskr.dto.admin.AdminProviderResponse;
import com.taaskr.entity.ProviderProfile;
import com.taaskr.entity.User;
import com.taaskr.exception.ResourceNotFoundException;
import com.taaskr.repository.ProviderProfileRepository;
import com.taaskr.service.AdminProviderService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdminProviderServiceImpl implements AdminProviderService {
    private final ProviderProfileRepository providerProfileRepository;

    public AdminProviderServiceImpl(
            ProviderProfileRepository providerProfileRepository) {
        this.providerProfileRepository = providerProfileRepository;
    }

    @Override
    public List<AdminProviderResponse> getAllProviders() {

        return providerProfileRepository.findAllByOrderByIdAsc()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public AdminProviderResponse approveProvider(Long providerId) {
        ProviderProfile providerProfile = providerProfileRepository.findById(providerId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Provider not found with id: " + providerId));

        providerProfile.setApproved(true);

        ProviderProfile savedProvider =
                providerProfileRepository.save(providerProfile);

        return mapToResponse(savedProvider);
    }

    private AdminProviderResponse mapToResponse(ProviderProfile providerProfile) {

        User user = providerProfile.getUser();

        return new AdminProviderResponse(
                providerProfile.getId(),
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                providerProfile.getExperienceYears(),
                providerProfile.getCity(),
                providerProfile.getPincode(),
                providerProfile.getApproved(),
                providerProfile.getRating(),
                providerProfile.getTotalJobs(),
                providerProfile.getBio()
        );
    }
}
