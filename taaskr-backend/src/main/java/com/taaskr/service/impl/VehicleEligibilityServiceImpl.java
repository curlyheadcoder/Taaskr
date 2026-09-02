package com.taaskr.service.impl;

import com.taaskr.dto.vehicle.VehicleEstimateOptionResponse;
import com.taaskr.dto.vehicle.VehicleEstimateRequest;
import com.taaskr.dto.vehicle.VehicleEstimateResponse;
import com.taaskr.entity.Service;
import com.taaskr.entity.ServiceCategory;
import com.taaskr.entity.Vehicle;
import com.taaskr.entity.VehiclePricingRule;
import com.taaskr.enums.VehicleType;
import com.taaskr.repository.ServiceCategoryRepository;
import com.taaskr.repository.ServiceRepository;
import com.taaskr.repository.VehicleRepository;
import com.taaskr.service.MapService;
import com.taaskr.service.VehicleEligibilityService;
import com.taaskr.service.VehiclePricingService;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@org.springframework.stereotype.Service
public class VehicleEligibilityServiceImpl implements VehicleEligibilityService {

    private final MapService mapService;
    private final VehiclePricingService vehiclePricingService;
    private final VehicleRepository vehicleRepository;
    private final ServiceRepository serviceRepository;
    private final ServiceCategoryRepository categoryRepository;

    public VehicleEligibilityServiceImpl(MapService mapService,
                                         VehiclePricingService vehiclePricingService,
                                         VehicleRepository vehicleRepository,
                                         ServiceRepository serviceRepository,
                                         ServiceCategoryRepository categoryRepository) {
        this.mapService = mapService;
        this.vehiclePricingService = vehiclePricingService;
        this.vehicleRepository = vehicleRepository;
        this.serviceRepository = serviceRepository;
        this.categoryRepository = categoryRepository;
    }

    @Override
    public VehicleEstimateResponse estimateVehicleOptions(VehicleEstimateRequest request) {
        BigDecimal distanceKm;
        if (request.getPickupLatitude() != null && request.getPickupLongitude() != null
                && request.getDropLatitude() != null && request.getDropLongitude() != null) {
            distanceKm = mapService.calculateDistanceKm(
                    request.getPickupLatitude(), request.getPickupLongitude(),
                    request.getDropLatitude(), request.getDropLongitude()
            );
        } else {
            distanceKm = mapService.estimateDistanceKm(
                    request.getPickupCity(), request.getPickupPincode(),
                    request.getDropCity(), request.getDropPincode()
            );
        }

        BigDecimal packageWeight = request.getPackageWeightKg() != null ? request.getPackageWeightKg() : BigDecimal.valueOf(5.0);

        // Find vehicle catalog category
        Optional<ServiceCategory> vehicleCatOpt = categoryRepository.findAll().stream()
                .filter(c -> c.getName() != null && (c.getName().toLowerCase().contains("vehicle") || c.getName().toLowerCase().contains("transport")))
                .findFirst();

        List<Service> catalogServices = vehicleCatOpt.isPresent()
                ? serviceRepository.findByCategoryIdAndActiveTrueOrderByNameAsc(vehicleCatOpt.get().getId())
                : List.of();

        List<VehicleEstimateOptionResponse> options = new ArrayList<>();

        for (VehicleType vehicleType : VehicleType.values()) {
            VehiclePricingRule rule = vehiclePricingService.getPricingRule(vehicleType);

            boolean isWeightEligible = packageWeight.compareTo(rule.getMaxCapacityKg()) <= 0;
            String eligibilityReason = isWeightEligible
                    ? "Weight within capacity (" + rule.getMaxCapacityKg() + " KG max)"
                    : "Exceeds max vehicle capacity (" + rule.getMaxCapacityKg() + " KG max)";

            BigDecimal estimatedFare = vehiclePricingService.calculatePrice(vehicleType, distanceKm);

            // Find matching catalog service if present, else synthesize
            Service matchingService = catalogServices.stream()
                    .filter(s -> matchesVehicleType(s.getName(), vehicleType))
                    .findFirst()
                    .orElse(null);

            Long serviceId = matchingService != null ? matchingService.getId() : null;
            String serviceName = matchingService != null ? matchingService.getName() : rule.getDisplayName();

            // Check how many available drivers exist in the pickup city
            List<Vehicle> availableVehicles = vehicleRepository.findAvailableVehiclesInCity(vehicleType, request.getPickupCity());
            int driversCount = availableVehicles.size();

            // Estimated arrival in minutes (5 to 15 mins based on available drivers and distance)
            int etaMinutes = driversCount > 0 ? Math.max(5, (int) Math.round(distanceKm.doubleValue() * 1.5) + 3) : 15;

            options.add(new VehicleEstimateOptionResponse(
                    serviceId,
                    serviceName,
                    vehicleType,
                    rule.getDisplayName(),
                    rule.getMaxCapacityKg(),
                    estimatedFare,
                    etaMinutes,
                    isWeightEligible,
                    eligibilityReason,
                    driversCount
            ));
        }

        return new VehicleEstimateResponse(
                request.getPickupCity(),
                request.getDropCity(),
                distanceKm,
                packageWeight,
                options
        );
    }

    @Override
    public VehicleType determineVehicleTypeFromService(Service service) {
        if (service == null || service.getName() == null) {
            return VehicleType.MINI_TRUCK;
        }
        String name = service.getName().toLowerCase();
        if (name.contains("electric bike") || name.contains("e-bike") || name.contains("ev bike")) {
            return VehicleType.TWO_WHEELER_ELECTRIC;
        }
        if (name.contains("petrol bike") || name.contains("bike") || name.contains("two wheeler") || name.contains("scooter")) {
            return VehicleType.TWO_WHEELER_PETROL;
        }
        if (name.contains("rickshaw") || name.contains("three wheeler") || name.contains("auto")) {
            return VehicleType.THREE_WHEELER_ELECTRIC;
        }
        if (name.contains("loading vehicle") || name.contains("champion") || name.contains("ape")) {
            return VehicleType.LOADING_VEHICLE;
        }
        if (name.contains("mini truck") || name.contains("tata ace") || name.contains("pickup")) {
            return VehicleType.MINI_TRUCK;
        }
        if (name.contains("heavy truck") || name.contains("large truck") || name.contains("20ft")) {
            return VehicleType.HEAVY_TRUCK;
        }
        if (name.contains("truck") || name.contains("14ft") || name.contains("17ft")) {
            return VehicleType.TRUCK;
        }
        return VehicleType.MINI_TRUCK;
    }

    private boolean matchesVehicleType(String serviceName, VehicleType type) {
        if (serviceName == null) return false;
        String s = serviceName.toLowerCase();
        return switch (type) {
            case TWO_WHEELER_ELECTRIC -> s.contains("electric bike") || s.contains("e-bike");
            case TWO_WHEELER_PETROL -> s.contains("petrol bike") || (s.contains("bike") && !s.contains("electric"));
            case THREE_WHEELER_ELECTRIC -> s.contains("rickshaw") || s.contains("three wheeler");
            case LOADING_VEHICLE -> s.contains("loading");
            case MINI_TRUCK -> s.contains("mini truck") || s.contains("tata ace");
            case TRUCK -> s.contains("truck") && !s.contains("mini") && !s.contains("heavy");
            case HEAVY_TRUCK -> s.contains("heavy");
        };
    }
}
