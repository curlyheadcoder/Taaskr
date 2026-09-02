package com.taaskr.service;

import com.taaskr.dto.vehicle.VehicleEstimateRequest;
import com.taaskr.dto.vehicle.VehicleEstimateResponse;
import com.taaskr.enums.VehicleType;

public interface VehicleEligibilityService {

    VehicleEstimateResponse estimateVehicleOptions(VehicleEstimateRequest request);

    VehicleType determineVehicleTypeFromService(com.taaskr.entity.Service service);
}
