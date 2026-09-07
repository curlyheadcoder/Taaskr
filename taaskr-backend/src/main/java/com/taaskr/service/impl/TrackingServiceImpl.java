package com.taaskr.service.impl;

import com.taaskr.dto.booking.LiveTrackingResponse;
import com.taaskr.dto.provider.UpdateLocationRequest;
import com.taaskr.entity.Booking;
import com.taaskr.entity.ProviderProfile;
import com.taaskr.entity.User;
import com.taaskr.entity.Vehicle;
import com.taaskr.enums.BookingStatus;
import com.taaskr.enums.Role;
import com.taaskr.exception.BadRequestException;
import com.taaskr.exception.ResourceNotFoundException;
import com.taaskr.repository.BookingRepository;
import com.taaskr.repository.ProviderProfileRepository;
import com.taaskr.repository.UserRepository;
import com.taaskr.repository.VehicleRepository;
import com.taaskr.service.MapService;
import com.taaskr.service.TrackingService;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class TrackingServiceImpl implements TrackingService {

    private final UserRepository userRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final BookingRepository bookingRepository;
    private final VehicleRepository vehicleRepository;
    private final MapService mapService;

    public TrackingServiceImpl(UserRepository userRepository,
                               ProviderProfileRepository providerProfileRepository,
                               BookingRepository bookingRepository,
                               VehicleRepository vehicleRepository,
                               MapService mapService) {
        this.userRepository = userRepository;
        this.providerProfileRepository = providerProfileRepository;
        this.bookingRepository = bookingRepository;
        this.vehicleRepository = vehicleRepository;
        this.mapService = mapService;
    }

    @Override
    @Transactional
    public void updateProviderLocation(String providerEmail, UpdateLocationRequest request) {
        User user = userRepository.findByEmail(providerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getRole() != Role.PROVIDER && user.getRole() != Role.ADMIN) {
            throw new BadRequestException("Only service providers can broadcast live location");
        }

        ProviderProfile provider = providerProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Provider profile not found"));

        provider.setCurrentLatitude(request.getLatitude());
        provider.setCurrentLongitude(request.getLongitude());
        provider.setLocationUpdatedAt(LocalDateTime.now());
        providerProfileRepository.save(provider);

        // Also sync coordinates to any vehicles registered to this provider
        List<Vehicle> vehicles = vehicleRepository.findAllByProviderId(provider.getId());
        for (Vehicle v : vehicles) {
            v.setCurrentLatitude(request.getLatitude());
            v.setCurrentLongitude(request.getLongitude());
            vehicleRepository.save(v);
        }
    }

    @Override
    @Transactional
    public LiveTrackingResponse getLiveTracking(String userEmail, Long bookingId) {
        User requester = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with ID: " + bookingId));

        boolean isCustomer = booking.getUser().getId().equals(requester.getId());
        boolean isAssignedProvider = booking.getProvider() != null &&
                booking.getProvider().getUser().getId().equals(requester.getId());
        boolean isAdmin = requester.getRole() == Role.ADMIN;

        if (!isCustomer && !isAssignedProvider && !isAdmin) {
            throw new BadRequestException("You are not authorized to view tracking data for this booking");
        }

        LiveTrackingResponse response = new LiveTrackingResponse();
        response.setBookingId(booking.getId());
        response.setBookingCode(booking.getBookingCode());
        response.setStatus(booking.getStatus());

        if (booking.getService() != null) {
            response.setServiceId(booking.getService().getId());
            response.setServiceName(booking.getService().getName());
            if (booking.getService().getCategory() != null) {
                response.setCategoryName(booking.getService().getCategory().getName());
            }
        }

        // Customer Details
        response.setUserId(booking.getUser().getId());
        response.setCustomerName(booking.getUser().getName());
        response.setAddress(booking.getAddress());
        response.setCity(booking.getCity());
        response.setPincode(booking.getPincode());
        response.setCustomerLatitude(booking.getLatitude());
        response.setCustomerLongitude(booking.getLongitude());

        // Drop Details (for vehicle transport)
        response.setDropAddress(booking.getDropAddress());
        response.setDropCity(booking.getDropCity());
        response.setDropPincode(booking.getDropPincode());
        response.setDropLatitude(booking.getDropLatitude());
        response.setDropLongitude(booking.getDropLongitude());

        // Provider Details (if assigned)
        ProviderProfile provider = booking.getProvider();
        if (provider != null) {
            response.setProviderId(provider.getId());
            if (provider.getUser() != null) {
                response.setProviderName(provider.getUser().getName());
                response.setProviderPhone(provider.getUser().getPhone());
            }
            response.setProviderRating(provider.getRating());
            response.setProviderExperienceYears(provider.getExperienceYears());
            response.setProviderBio(provider.getBio());

            // Check provider location
            BigDecimal pLat = provider.getCurrentLatitude();
            BigDecimal pLng = provider.getCurrentLongitude();

            // Fallback to vehicle location if provider profile coordinates not populated
            if ((pLat == null || pLng == null) && booking.getVehicle() != null) {
                pLat = booking.getVehicle().getCurrentLatitude();
                pLng = booking.getVehicle().getCurrentLongitude();
            }

            response.setProviderLatitude(pLat);
            response.setProviderLongitude(pLng);
            response.setLocationUpdatedAt(provider.getLocationUpdatedAt());

            boolean isLive = provider.getLocationUpdatedAt() != null &&
                    provider.getLocationUpdatedAt().isAfter(LocalDateTime.now().minusMinutes(20));
            response.setIsLive(isLive);

            // Vehicle Details (if attached to booking or provider)
            Vehicle vehicle = booking.getVehicle();
            if (vehicle == null) {
                List<Vehicle> pVehicles = vehicleRepository.findAllByProviderId(provider.getId());
                if (!pVehicles.isEmpty()) {
                    vehicle = pVehicles.get(0);
                }
            }

            if (vehicle != null) {
                response.setVehicleType(vehicle.getVehicleType());
                response.setVehicleModel(vehicle.getModelName());
                response.setVehicleRegistrationNumber(vehicle.getRegistrationNumber());
            }

            // Distance & ETA Calculations
            if (pLat != null && pLng != null) {
                BigDecimal targetLat = booking.getLatitude();
                BigDecimal targetLng = booking.getLongitude();

                // If in transit and drop location is set, calculate distance to drop location
                if (booking.getStatus() == BookingStatus.IN_TRANSIT && booking.getDropLatitude() != null && booking.getDropLongitude() != null) {
                    targetLat = booking.getDropLatitude();
                    targetLng = booking.getDropLongitude();
                }

                if (targetLat != null && targetLng != null) {
                    BigDecimal distKm = mapService.calculateDistanceKm(pLat, pLng, targetLat, targetLng);
                    response.setDistanceKm(distKm);

                    // Assume average city travel speed 25 km/h
                    double hours = distKm.doubleValue() / 25.0;
                    int minutes = (int) Math.round(hours * 60.0);
                    if (distKm.doubleValue() < 0.3) {
                        minutes = 1; // < 300m away -> arriving
                    } else if (minutes < 2) {
                        minutes = 2;
                    }
                    response.setEstimatedEtaMinutes(minutes);
                }
            }
        }

        return response;
    }
}
