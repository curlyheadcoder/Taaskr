package com.taaskr.service;

import com.taaskr.dto.booking.LiveTrackingResponse;
import com.taaskr.dto.provider.UpdateLocationRequest;

public interface TrackingService {
    void updateProviderLocation(String providerEmail, UpdateLocationRequest request);
    LiveTrackingResponse getLiveTracking(String userEmail, Long bookingId);
}
