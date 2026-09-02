package com.taaskr.service;

import com.taaskr.entity.ProviderProfile;
import com.taaskr.entity.Vehicle;
import com.taaskr.enums.VehicleType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;

public interface VehicleDispatchService {

    record DispatchMatch(ProviderProfile provider, Vehicle vehicle, BigDecimal distanceKm) {}

    Optional<DispatchMatch> findBestDriverForTrip(VehicleType vehicleType,
                                                  String city,
                                                  String pincode,
                                                  BigDecimal pickupLat,
                                                  BigDecimal pickupLng,
                                                  LocalDate date,
                                                  LocalTime startTime,
                                                  LocalTime endTime);
}
