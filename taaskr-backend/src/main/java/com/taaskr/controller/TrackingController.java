package com.taaskr.controller;

import com.taaskr.dto.booking.LiveTrackingResponse;
import com.taaskr.dto.provider.UpdateLocationRequest;
import com.taaskr.service.TrackingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class TrackingController {

    private final TrackingService trackingService;

    public TrackingController(TrackingService trackingService) {
        this.trackingService = trackingService;
    }

    @PostMapping("/provider/location")
    @PreAuthorize("hasAnyRole('PROVIDER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> updateLocation(Authentication authentication,
                                                              @Valid @RequestBody UpdateLocationRequest request) {
        trackingService.updateProviderLocation(authentication.getName(), request);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Provider location updated successfully",
                "latitude", request.getLatitude(),
                "longitude", request.getLongitude()
        ));
    }

    @GetMapping("/bookings/{bookingId}/track")
    @PreAuthorize("hasAnyRole('USER', 'PROVIDER', 'ADMIN')")
    public ResponseEntity<LiveTrackingResponse> getLiveTracking(Authentication authentication,
                                                                @PathVariable Long bookingId) {
        LiveTrackingResponse tracking = trackingService.getLiveTracking(authentication.getName(), bookingId);
        return ResponseEntity.ok(tracking);
    }
}
