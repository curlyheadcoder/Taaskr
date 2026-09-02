package com.taaskr.service.impl;

import com.taaskr.entity.Vehicle;
import com.taaskr.enums.VehicleType;
import com.taaskr.repository.BookingRepository;
import com.taaskr.repository.VehicleRepository;
import com.taaskr.service.MapService;
import com.taaskr.service.VehicleDispatchService;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
public class VehicleDispatchServiceImpl implements VehicleDispatchService {

    private final VehicleRepository vehicleRepository;
    private final BookingRepository bookingRepository;
    private final MapService mapService;

    public VehicleDispatchServiceImpl(VehicleRepository vehicleRepository,
                                     BookingRepository bookingRepository,
                                     MapService mapService) {
        this.vehicleRepository = vehicleRepository;
        this.bookingRepository = bookingRepository;
        this.mapService = mapService;
    }

    @Override
    public Optional<DispatchMatch> findBestDriverForTrip(VehicleType vehicleType,
                                                         String city,
                                                         String pincode,
                                                         BigDecimal pickupLat,
                                                         BigDecimal pickupLng,
                                                         LocalDate date,
                                                         LocalTime startTime,
                                                         LocalTime endTime) {

        List<Vehicle> candidateVehicles = vehicleRepository.findAvailableVehiclesInCity(vehicleType, city);

        if (candidateVehicles.isEmpty()) {
            return Optional.empty();
        }

        return candidateVehicles.stream()
                .filter(vehicle -> {
                    // Ensure no conflicting bookings
                    boolean hasOverlap = bookingRepository.existsByProviderIdAndBookingDateAndStartTimeLessThanAndEndTimeGreaterThan(
                            vehicle.getProvider().getId(), date, endTime, startTime);
                    return !hasOverlap;
                })
                .map(vehicle -> {
                    BigDecimal distanceToPickup;
                    if (pickupLat != null && pickupLng != null && vehicle.getCurrentLatitude() != null && vehicle.getCurrentLongitude() != null) {
                        distanceToPickup = mapService.calculateDistanceKm(pickupLat, pickupLng, vehicle.getCurrentLatitude(), vehicle.getCurrentLongitude());
                    } else if (pincode != null && vehicle.getProvider().getPincode() != null && pincode.equalsIgnoreCase(vehicle.getProvider().getPincode())) {
                        distanceToPickup = BigDecimal.valueOf(1.5);
                    } else {
                        distanceToPickup = BigDecimal.valueOf(4.0);
                    }
                    return new DispatchMatch(vehicle.getProvider(), vehicle, distanceToPickup);
                })
                .sorted(
                        Comparator.comparing(DispatchMatch::distanceKm)
                                .thenComparing((DispatchMatch m) -> m.provider().getRating() != null ? m.provider().getRating() : 0.0, Comparator.reverseOrder())
                )
                .findFirst();
    }
}
