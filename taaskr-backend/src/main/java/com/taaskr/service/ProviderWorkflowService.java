package com.taaskr.service;

import com.taaskr.dto.provider.AvailabilityResponse;
import com.taaskr.dto.provider.CreateAvailabilityRequest;
import com.taaskr.dto.provider.ProviderBookingResponse;
import com.taaskr.dto.provider.UpdateProviderBookingStatusRequest;

import com.taaskr.dto.provider.ProviderProfileResponse;
import com.taaskr.dto.provider.UpdateProviderProfileRequest;
import com.taaskr.dto.provider.UpdateProviderCategoriesRequest;
import com.taaskr.dto.service.CategoryResponse;

import java.util.List;

public interface ProviderWorkflowService {

    AvailabilityResponse createAvailability(String provideEmail, CreateAvailabilityRequest request);

    List<AvailabilityResponse> getMyAvailability(String providerEmail);

    void deleteAvailability(String providerEmail, Long availabilityId);

    List<ProviderBookingResponse> getMyAssignedBookings(String providerEmail);

    ProviderBookingResponse acceptBooking(String providerEmail, Long bookingId);

    ProviderBookingResponse rejectBooking(String providerEmail, Long bookingId);

    ProviderBookingResponse updateBookingStatus(String providerEmail, Long bookingId, UpdateProviderBookingStatusRequest request);

    ProviderBookingResponse markAfterServicePaymentReceived(String providerEmail, Long bookingId);

    ProviderProfileResponse getProviderProfile(String providerEmail);

    ProviderProfileResponse updateProviderProfile(String providerEmail, UpdateProviderProfileRequest request);

    List<CategoryResponse> getMyCategories(String providerEmail);
    
    List<CategoryResponse> updateMyCategories(String providerEmail, UpdateProviderCategoriesRequest request);
}
