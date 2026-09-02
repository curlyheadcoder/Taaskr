package com.taaskr.controller;

import com.taaskr.dto.vehicle.*;
import com.taaskr.entity.ProviderProfile;
import com.taaskr.entity.User;
import com.taaskr.entity.Vehicle;
import com.taaskr.entity.VehiclePricingRule;
import com.taaskr.enums.Role;
import com.taaskr.exception.BadRequestException;
import com.taaskr.exception.ResourceNotFoundException;
import com.taaskr.repository.ProviderProfileRepository;
import com.taaskr.repository.UserRepository;
import com.taaskr.repository.VehicleRepository;
import com.taaskr.service.VehicleEligibilityService;
import com.taaskr.service.VehiclePricingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vehicle")
public class VehicleController {

    private final VehicleEligibilityService eligibilityService;
    private final VehiclePricingService pricingService;
    private final VehicleRepository vehicleRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final UserRepository userRepository;

    public VehicleController(VehicleEligibilityService eligibilityService,
                             VehiclePricingService pricingService,
                             VehicleRepository vehicleRepository,
                             ProviderProfileRepository providerProfileRepository,
                             UserRepository userRepository) {
        this.eligibilityService = eligibilityService;
        this.pricingService = pricingService;
        this.vehicleRepository = vehicleRepository;
        this.providerProfileRepository = providerProfileRepository;
        this.userRepository = userRepository;
    }

    @PostMapping("/estimate")
    public ResponseEntity<VehicleEstimateResponse> estimateVehicles(@Valid @RequestBody VehicleEstimateRequest request) {
        VehicleEstimateResponse response = eligibilityService.estimateVehicleOptions(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/my-vehicle")
    @PreAuthorize("hasRole('PROVIDER')")
    public ResponseEntity<VehicleResponse> getMyVehicle(Authentication authentication) {
        ProviderProfile provider = getProviderFromAuth(authentication);
        Vehicle vehicle = vehicleRepository.findByProviderId(provider.getId())
                .orElseThrow(() -> new ResourceNotFoundException("No vehicle registered for this provider"));
        return ResponseEntity.ok(mapVehicle(vehicle));
    }

    @PostMapping("/register")
    @PreAuthorize("hasRole('PROVIDER')")
    public ResponseEntity<VehicleResponse> registerVehicle(Authentication authentication,
                                                           @Valid @RequestBody CreateVehicleRequest request) {
        ProviderProfile provider = getProviderFromAuth(authentication);

        Vehicle vehicle = vehicleRepository.findByProviderId(provider.getId())
                .orElseGet(Vehicle::new);

        if (vehicle.getId() == null && vehicleRepository.existsByRegistrationNumber(request.getRegistrationNumber())) {
            throw new BadRequestException("Registration number already registered");
        }

        vehicle.setProvider(provider);
        vehicle.setVehicleType(request.getVehicleType());
        vehicle.setFuelType(request.getFuelType());
        vehicle.setModelName(request.getModelName());
        vehicle.setRegistrationNumber(request.getRegistrationNumber().trim().toUpperCase());
        vehicle.setCapacityKg(request.getCapacityKg());
        if (request.getAvailable() != null) {
            vehicle.setAvailable(request.getAvailable());
        }
        if (request.getCurrentLatitude() != null) {
            vehicle.setCurrentLatitude(request.getCurrentLatitude());
        }
        if (request.getCurrentLongitude() != null) {
            vehicle.setCurrentLongitude(request.getCurrentLongitude());
        }

        Vehicle saved = vehicleRepository.save(vehicle);
        return ResponseEntity.ok(mapVehicle(saved));
    }

    @PostMapping("/location")
    @PreAuthorize("hasRole('PROVIDER')")
    public ResponseEntity<VehicleResponse> updateLocation(Authentication authentication,
                                                          @Valid @RequestBody UpdateVehicleLocationRequest request) {
        ProviderProfile provider = getProviderFromAuth(authentication);
        Vehicle vehicle = vehicleRepository.findByProviderId(provider.getId())
                .orElseThrow(() -> new ResourceNotFoundException("No vehicle registered for this provider"));

        vehicle.setCurrentLatitude(request.getLatitude());
        vehicle.setCurrentLongitude(request.getLongitude());
        if (request.getAvailable() != null) {
            vehicle.setAvailable(request.getAvailable());
        }

        Vehicle saved = vehicleRepository.save(vehicle);
        return ResponseEntity.ok(mapVehicle(saved));
    }

    @GetMapping("/pricing-rules")
    public ResponseEntity<List<VehiclePricingRule>> getPricingRules() {
        return ResponseEntity.ok(pricingService.getAllPricingRules());
    }

    @PutMapping("/pricing-rules/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<VehiclePricingRule> updatePricingRule(@PathVariable Long id,
                                                                @RequestBody VehiclePricingRule ruleData) {
        return ResponseEntity.ok(pricingService.updatePricingRule(id, ruleData));
    }

    private ProviderProfile getProviderFromAuth(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getRole() != Role.PROVIDER) {
            throw new BadRequestException("User is not a provider");
        }

        return providerProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Provider profile not found"));
    }

    private VehicleResponse mapVehicle(Vehicle vehicle) {
        return new VehicleResponse(
                vehicle.getId(),
                vehicle.getProvider().getId(),
                vehicle.getProvider().getUser().getName(),
                vehicle.getVehicleType(),
                vehicle.getVehicleType().getDisplayName(),
                vehicle.getFuelType(),
                vehicle.getModelName(),
                vehicle.getRegistrationNumber(),
                vehicle.getCapacityKg(),
                vehicle.getActive(),
                vehicle.getAvailable(),
                vehicle.getCurrentLatitude(),
                vehicle.getCurrentLongitude(),
                vehicle.getCreatedAt(),
                vehicle.getUpdatedAt()
        );
    }
}
