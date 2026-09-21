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
import com.taaskr.dto.routing.RoutingResult;
import com.taaskr.service.MapService;
import com.taaskr.service.RoutingService;
import com.taaskr.service.TrackingService;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

@Service
public class TrackingServiceImpl implements TrackingService {

    private final UserRepository userRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final BookingRepository bookingRepository;
    private final VehicleRepository vehicleRepository;
    private final MapService mapService;
    private final RoutingService routingService;
    private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    public TrackingServiceImpl(UserRepository userRepository,
                               ProviderProfileRepository providerProfileRepository,
                               BookingRepository bookingRepository,
                               VehicleRepository vehicleRepository,
                               MapService mapService,
                               RoutingService routingService,
                               org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate) {
        this.userRepository = userRepository;
        this.providerProfileRepository = providerProfileRepository;
        this.bookingRepository = bookingRepository;
        this.vehicleRepository = vehicleRepository;
        this.mapService = mapService;
        this.routingService = routingService;
        this.messagingTemplate = messagingTemplate;
    }

    @Override
    @Transactional
    public void updateProviderLocation(String providerEmail, UpdateLocationRequest request) {
        if (request == null || request.getTimestamp() == null) {
            throw new BadRequestException("Timestamp is required for location tracking telemetry");
        }

        long currentServerTime = System.currentTimeMillis();
        if (request.getTimestamp() > currentServerTime + 60_000L) {
            throw new BadRequestException("Telemetry timestamp cannot be in the future");
        }

        User user = userRepository.findByEmail(providerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getRole() != Role.PROVIDER && user.getRole() != Role.ADMIN) {
            throw new BadRequestException("Only service providers can broadcast live location");
        }

        ProviderProfile provider = providerProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Provider profile not found"));

        List<Booking> activeBookings = bookingRepository.findByProviderIdAndStatusIn(
                provider.getId(),
                List.of(BookingStatus.ASSIGNED, BookingStatus.ACCEPTED, BookingStatus.IN_PROGRESS, BookingStatus.IN_TRANSIT, BookingStatus.ON_THE_WAY)
        );

        if (activeBookings.isEmpty()) {
            throw new BadRequestException("Location tracking is only active during an active booking assignment");
        }

        LocalDateTime sampleTime = LocalDateTime.ofInstant(Instant.ofEpochMilli(request.getTimestamp()), ZoneId.systemDefault());

        if (provider.getLocationUpdatedAt() != null) {
            long lastAcceptedMillis = provider.getLocationUpdatedAt().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
            if (request.getTimestamp() <= lastAcceptedMillis) {
                // Out-of-order or duplicate telemetry packet: ignore stale sample
                return;
            }
        }

        provider.setCurrentLatitude(request.getLatitude());
        provider.setCurrentLongitude(request.getLongitude());
        provider.setLocationUpdatedAt(sampleTime);
        providerProfileRepository.save(provider);

        // Also sync coordinates to any vehicles registered to this provider
        List<Vehicle> vehicles = vehicleRepository.findAllByProviderId(provider.getId());
        for (Vehicle v : vehicles) {
            v.setCurrentLatitude(request.getLatitude());
            v.setCurrentLongitude(request.getLongitude());
            vehicleRepository.save(v);
        }

        // Real-Time STOMP WebSocket broadcast to all active bookings
        try {
            for (Booking b : activeBookings) {
                messagingTemplate.convertAndSend("/topic/bookings/" + b.getId() + "/location", java.util.Map.of(
                        "bookingId", b.getId(),
                        "bookingCode", b.getBookingCode(),
                        "providerLatitude", request.getLatitude(),
                        "providerLongitude", request.getLongitude(),
                        "status", b.getStatus().name(),
                        "isLive", true,
                        "timestamp", sampleTime.toString()
                ));
            }
        } catch (Exception e) {
            // Log notice without breaking transaction
        }

    }

    @Override
    public boolean isAuthorizedForBooking(String userEmail, Long bookingId) {
        if (userEmail == null || bookingId == null) {
            return false;
        }
        User requester = userRepository.findByEmail(userEmail).orElse(null);
        if (requester == null) {
            return false;
        }
        Booking booking = bookingRepository.findById(bookingId).orElse(null);
        if (booking == null) {
            return false;
        }

        boolean isCustomer = booking.getUser() != null && booking.getUser().getId().equals(requester.getId());
        boolean isAssignedProvider = booking.getProvider() != null &&
                booking.getProvider().getUser() != null &&
                booking.getProvider().getUser().getId().equals(requester.getId());
        boolean isAssignedPartner = booking.getServicePartner() != null &&
                booking.getServicePartner().getUser() != null &&
                booking.getServicePartner().getUser().getId().equals(requester.getId());
        boolean isAdmin = requester.getRole() == Role.ADMIN;

        return isCustomer || isAssignedProvider || isAssignedPartner || isAdmin;
    }

    @Override
    @Transactional
    public LiveTrackingResponse getLiveTracking(String userEmail, Long bookingId) {
        if (!isAuthorizedForBooking(userEmail, bookingId)) {
            throw new BadRequestException("You are not authorized to view tracking data for this booking");
        }

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with ID: " + bookingId));


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

        // Service Partner Details (if assigned)
        com.taaskr.entity.ServicePartner partner = booking.getServicePartner();
        if (partner != null) {
            response.setServicePartnerId(partner.getId());
            response.setServicePartnerName(partner.getName());
            response.setServicePartnerPhone(partner.getPhone());
            response.setServicePartnerTitle(partner.getTitle());
            response.setServicePartnerRating(partner.getRating());
            response.setPartnerLatitude(partner.getCurrentLatitude());
            response.setPartnerLongitude(partner.getCurrentLongitude());

            boolean isArrived = booking.getStatus() == BookingStatus.ARRIVED ||
                    booking.getStatus() == BookingStatus.WORK_STARTED ||
                    booking.getStatus() == BookingStatus.WORK_COMPLETED ||
                    booking.getStatus() == BookingStatus.PAYMENT_COMPLETED ||
                    booking.getStatus() == BookingStatus.PROVIDER_APPROVED ||
                    booking.getStatus() == BookingStatus.COMPLETED;

            response.setArrived(isArrived);

            // Live tracking only active while ON_THE_WAY
            boolean isLive = !isArrived && booking.getStatus() == BookingStatus.ON_THE_WAY &&
                    partner.getLocationUpdatedAt() != null &&
                    partner.getLocationUpdatedAt().isAfter(LocalDateTime.now().minusMinutes(20));
            response.setIsLive(isLive);
        }

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

            BigDecimal pLat = partner != null && partner.getCurrentLatitude() != null
                    ? partner.getCurrentLatitude()
                    : provider.getCurrentLatitude();
            BigDecimal pLng = partner != null && partner.getCurrentLongitude() != null
                    ? partner.getCurrentLongitude()
                    : provider.getCurrentLongitude();

            if ((pLat == null || pLng == null) && booking.getVehicle() != null) {
                pLat = booking.getVehicle().getCurrentLatitude();
                pLng = booking.getVehicle().getCurrentLongitude();
            }

            response.setProviderLatitude(pLat);
            response.setProviderLongitude(pLng);
            response.setLocationUpdatedAt(partner != null ? partner.getLocationUpdatedAt() : provider.getLocationUpdatedAt());

            if (partner == null) {
                boolean isLive = provider.getLocationUpdatedAt() != null &&
                        provider.getLocationUpdatedAt().isAfter(LocalDateTime.now().minusMinutes(20));
                response.setIsLive(isLive);
            }

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

            // Distance & ETA Calculations using Road-Network Routing Service
            if (pLat != null && pLng != null) {
                BigDecimal targetLat = booking.getLatitude();
                BigDecimal targetLng = booking.getLongitude();

                if (booking.getStatus() == BookingStatus.IN_TRANSIT && booking.getDropLatitude() != null && booking.getDropLongitude() != null) {
                    targetLat = booking.getDropLatitude();
                    targetLng = booking.getDropLongitude();
                }

                if (targetLat != null && targetLng != null) {
                    RoutingResult route = routingService.calculateRoute(pLat, pLng, targetLat, targetLng, booking.getId());
                    response.setDistanceKm(route.getDistanceKm());
                    response.setEstimatedEtaMinutes(route.getEstimatedEtaMinutes());
                    response.setRouteSource(route.getRouteSource());
                }
            }
        }

        return response;
    }
}
