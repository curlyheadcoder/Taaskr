package com.taaskr.repository;

import com.taaskr.entity.VehiclePricingRule;
import com.taaskr.enums.VehicleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VehiclePricingRuleRepository extends JpaRepository<VehiclePricingRule, Long> {

    Optional<VehiclePricingRule> findByVehicleType(VehicleType vehicleType);

    Optional<VehiclePricingRule> findByVehicleTypeAndActiveTrue(VehicleType vehicleType);

    List<VehiclePricingRule> findByActiveTrue();
}
