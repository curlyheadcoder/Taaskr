package com.taaskr.dto.vehicle;

import java.math.BigDecimal;
import java.util.List;

public class VehicleEstimateResponse {

    private String pickupCity;
    private String dropCity;
    private BigDecimal distanceKm;
    private BigDecimal packageWeightKg;
    private List<VehicleEstimateOptionResponse> options;

    public VehicleEstimateResponse() {
    }

    public VehicleEstimateResponse(String pickupCity, String dropCity, BigDecimal distanceKm, BigDecimal packageWeightKg, List<VehicleEstimateOptionResponse> options) {
        this.pickupCity = pickupCity;
        this.dropCity = dropCity;
        this.distanceKm = distanceKm;
        this.packageWeightKg = packageWeightKg;
        this.options = options;
    }

    public String getPickupCity() {
        return pickupCity;
    }

    public void setPickupCity(String pickupCity) {
        this.pickupCity = pickupCity;
    }

    public String getDropCity() {
        return dropCity;
    }

    public void setDropCity(String dropCity) {
        this.dropCity = dropCity;
    }

    public BigDecimal getDistanceKm() {
        return distanceKm;
    }

    public void setDistanceKm(BigDecimal distanceKm) {
        this.distanceKm = distanceKm;
    }

    public BigDecimal getPackageWeightKg() {
        return packageWeightKg;
    }

    public void setPackageWeightKg(BigDecimal packageWeightKg) {
        this.packageWeightKg = packageWeightKg;
    }

    public List<VehicleEstimateOptionResponse> getOptions() {
        return options;
    }

    public void setOptions(List<VehicleEstimateOptionResponse> options) {
        this.options = options;
    }
}
