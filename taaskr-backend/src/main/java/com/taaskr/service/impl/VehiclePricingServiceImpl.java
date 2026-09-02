package com.taaskr.service.impl;

import com.taaskr.entity.VehiclePricingRule;
import com.taaskr.enums.VehicleType;
import com.taaskr.exception.ResourceNotFoundException;
import com.taaskr.repository.VehiclePricingRuleRepository;
import com.taaskr.service.VehiclePricingService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
public class VehiclePricingServiceImpl implements VehiclePricingService {

    private final VehiclePricingRuleRepository ruleRepository;

    public VehiclePricingServiceImpl(VehiclePricingRuleRepository ruleRepository) {
        this.ruleRepository = ruleRepository;
    }

    @Override
    public BigDecimal calculatePrice(VehicleType vehicleType, BigDecimal distanceKm) {
        VehiclePricingRule rule = getPricingRule(vehicleType);

        BigDecimal distance = distanceKm != null && distanceKm.compareTo(BigDecimal.ZERO) > 0
                ? distanceKm
                : BigDecimal.valueOf(1.0);

        BigDecimal baseFare = rule.getBaseFare();
        BigDecimal baseDistance = rule.getBaseDistanceKm() != null ? rule.getBaseDistanceKm() : BigDecimal.valueOf(2.0);
        BigDecimal perKmRate = rule.getPerKmRate();
        BigDecimal minimumFare = rule.getMinimumFare();

        BigDecimal extraDistance = distance.subtract(baseDistance);
        BigDecimal extraFare = BigDecimal.ZERO;
        if (extraDistance.compareTo(BigDecimal.ZERO) > 0) {
            extraFare = extraDistance.multiply(perKmRate);
        }

        BigDecimal calculatedTotal = baseFare.add(extraFare);
        BigDecimal finalPrice = calculatedTotal.max(minimumFare);

        return finalPrice.setScale(2, RoundingMode.HALF_UP);
    }

    @Override
    public VehiclePricingRule getPricingRule(VehicleType vehicleType) {
        return ruleRepository.findByVehicleTypeAndActiveTrue(vehicleType)
                .orElseGet(() -> createFallbackRule(vehicleType));
    }

    @Override
    public List<VehiclePricingRule> getAllPricingRules() {
        return ruleRepository.findAll();
    }

    @Override
    @Transactional
    public VehiclePricingRule updatePricingRule(Long id, VehiclePricingRule ruleData) {
        VehiclePricingRule existing = ruleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pricing rule not found with id: " + id));

        if (ruleData.getBaseFare() != null) existing.setBaseFare(ruleData.getBaseFare());
        if (ruleData.getBaseDistanceKm() != null) existing.setBaseDistanceKm(ruleData.getBaseDistanceKm());
        if (ruleData.getPerKmRate() != null) existing.setPerKmRate(ruleData.getPerKmRate());
        if (ruleData.getMinimumFare() != null) existing.setMinimumFare(ruleData.getMinimumFare());
        if (ruleData.getMaxCapacityKg() != null) existing.setMaxCapacityKg(ruleData.getMaxCapacityKg());
        if (ruleData.getDisplayName() != null) existing.setDisplayName(ruleData.getDisplayName());
        if (ruleData.getActive() != null) existing.setActive(ruleData.getActive());

        return ruleRepository.save(existing);
    }

    private VehiclePricingRule createFallbackRule(VehicleType type) {
        return switch (type) {
            case TWO_WHEELER_ELECTRIC -> new VehiclePricingRule(type, "Electric Bike", new BigDecimal("40.00"), new BigDecimal("2.0"), new BigDecimal("12.00"), new BigDecimal("40.00"), new BigDecimal("20.00"));
            case TWO_WHEELER_PETROL -> new VehiclePricingRule(type, "Petrol Bike", new BigDecimal("45.00"), new BigDecimal("2.0"), new BigDecimal("14.00"), new BigDecimal("45.00"), new BigDecimal("25.00"));
            case THREE_WHEELER_ELECTRIC -> new VehiclePricingRule(type, "Electric Rickshaw", new BigDecimal("90.00"), new BigDecimal("2.0"), new BigDecimal("20.00"), new BigDecimal("90.00"), new BigDecimal("250.00"));
            case LOADING_VEHICLE -> new VehiclePricingRule(type, "Loading Vehicle (3W)", new BigDecimal("150.00"), new BigDecimal("2.0"), new BigDecimal("25.00"), new BigDecimal("150.00"), new BigDecimal("500.00"));
            case MINI_TRUCK -> new VehiclePricingRule(type, "Mini Truck (Tata Ace)", new BigDecimal("250.00"), new BigDecimal("3.0"), new BigDecimal("32.00"), new BigDecimal("250.00"), new BigDecimal("1000.00"));
            case TRUCK -> new VehiclePricingRule(type, "Truck (14ft / 17ft)", new BigDecimal("600.00"), new BigDecimal("5.0"), new BigDecimal("50.00"), new BigDecimal("600.00"), new BigDecimal("2500.00"));
            case HEAVY_TRUCK -> new VehiclePricingRule(type, "Heavy Truck", new BigDecimal("1200.00"), new BigDecimal("5.0"), new BigDecimal("85.00"), new BigDecimal("1200.00"), new BigDecimal("7000.00"));
        };
    }
}
