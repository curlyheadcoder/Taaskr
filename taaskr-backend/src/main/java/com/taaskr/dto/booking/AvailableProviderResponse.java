package com.taaskr.dto.booking;

public record AvailableProviderResponse(
        Long providerId,
        String name,
        Double rating,
        Integer experienceYears,
        String city,
        String pincode,
        String bio
) {}
