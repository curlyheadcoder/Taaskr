package com.taaskr.service;

import com.taaskr.entity.VehiclePricingRule;
import com.taaskr.enums.VehicleType;

import java.math.BigDecimal;
import java.util.List;

public interface VehiclePricingService {

    BigDecimal calculatePrice(VehicleType vehicleType, BigDecimal distanceKm);

    VehiclePricingRule getPricingRule(VehicleType vehicleType);

    List<VehiclePricingRule> getAllPricingRules();

    VehiclePricingRule updatePricingRule(Long id, VehiclePricingRule ruleData);
}
