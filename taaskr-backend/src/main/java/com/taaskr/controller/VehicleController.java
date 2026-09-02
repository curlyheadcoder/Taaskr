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
import jakarta.transaction.Transactional;
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
    @Transactional
    public ResponseEntity<VehicleResponse> getMyVehicle(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getRole() != Role.PROVIDER) {
            throw new BadRequestException("User is not a provider");
        }

        ProviderProfile provider = providerProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Provider profile not found"));

        Vehicle vehicle = vehicleRepository.findByProviderId(provider.getId())
                .orElseThrow(() -> new ResourceNotFoundException("No vehicle registered for this provider"));

        return ResponseEntity.ok(mapVehicle(vehicle, user.getName()));
    }

    @PostMapping("/register")
    @PreAuthorize("hasRole('PROVIDER')")
    @Transactional
    public ResponseEntity<VehicleResponse> registerVehicle(Authentication authentication,
                                                           @Valid @RequestBody CreateVehicleRequest request) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getRole() != Role.PROVIDER) {
            throw new BadRequestException("User is not a provider");
        }

        ProviderProfile provider = providerProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Provider profile not found"));

        Vehicle vehicle = vehicleRepository.findByProviderId(provider.getId())
                .orElseGet(Vehicle::new);

        String regPlate = request.getRegistrationNumber().trim().toUpperCase();
        var existingWithPlate = vehicleRepository.findByRegistrationNumber(regPlate);
        if (existingWithPlate.isPresent() && (vehicle.getId() == null || !existingWithPlate.get().getId().equals(vehicle.getId()))) {
            throw new BadRequestException("Registration plate " + regPlate + " is already registered with another vehicle");
        }

        vehicle.setProvider(provider);
        vehicle.setVehicleType(request.getVehicleType());
        vehicle.setFuelType(request.getFuelType());
        vehicle.setModelName(request.getModelName().trim());
        vehicle.setRegistrationNumber(regPlate);
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
        return ResponseEntity.ok(mapVehicle(saved, user.getName()));
    }

    @PostMapping("/location")
    @PreAuthorize("hasRole('PROVIDER')")
    @Transactional
    public ResponseEntity<VehicleResponse> updateLocation(Authentication authentication,
                                                          @Valid @RequestBody UpdateVehicleLocationRequest request) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getRole() != Role.PROVIDER) {
            throw new BadRequestException("User is not a provider");
        }

        ProviderProfile provider = providerProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Provider profile not found"));

        Vehicle vehicle = vehicleRepository.findByProviderId(provider.getId())
                .orElseThrow(() -> new ResourceNotFoundException("No vehicle registered for this provider"));

        vehicle.setCurrentLatitude(request.getLatitude());
        vehicle.setCurrentLongitude(request.getLongitude());
        if (request.getAvailable() != null) {
            vehicle.setAvailable(request.getAvailable());
        }

        Vehicle saved = vehicleRepository.save(vehicle);
        return ResponseEntity.ok(mapVehicle(saved, user.getName()));
    }

    @GetMapping("/pricing-rules")
    public ResponseEntity<List<VehiclePricingRule>> getPricingRules() {
        return ResponseEntity.ok(pricingService.getAllPricingRules());
    }

    @PutMapping("/pricing-rules/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<VehiclePricingRule> updatePricingRule(@PathVariable Long id,
                                                                @RequestBody VehiclePricingRule ruleData) {
        return ResponseEntity.ok(pricingService.updatePricingRule(id, ruleData));
    }

    private VehicleResponse mapVehicle(Vehicle vehicle, String providerName) {
        return new VehicleResponse(
                vehicle.getId(),
                vehicle.getProvider() != null ? vehicle.getProvider().getId() : null,
                providerName,
                vehicle.getVehicleType(),
                vehicle.getVehicleType() != null ? vehicle.getVehicleType().getDisplayName() : "",
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
