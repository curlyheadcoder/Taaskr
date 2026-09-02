package com.taaskr.dto.vehicle;

import com.taaskr.enums.VehicleType;

import java.math.BigDecimal;

public class VehicleEstimateOptionResponse {

    private Long serviceId;
    private String serviceName;
    private VehicleType vehicleType;
    private String displayName;
    private BigDecimal maxCapacityKg;
    private BigDecimal estimatedFare;
    private Integer estimatedArrivalMinutes;
    private Boolean isEligible;
    private String eligibilityReason;
    private Integer availableDriversCount;

    public VehicleEstimateOptionResponse() {
    }

    public VehicleEstimateOptionResponse(Long serviceId, String serviceName, VehicleType vehicleType, String displayName, BigDecimal maxCapacityKg, BigDecimal estimatedFare, Integer estimatedArrivalMinutes, Boolean isEligible, String eligibilityReason, Integer availableDriversCount) {
        this.serviceId = serviceId;
        this.serviceName = serviceName;
        this.vehicleType = vehicleType;
        this.displayName = displayName;
        this.maxCapacityKg = maxCapacityKg;
        this.estimatedFare = estimatedFare;
        this.estimatedArrivalMinutes = estimatedArrivalMinutes;
        this.isEligible = isEligible;
        this.eligibilityReason = eligibilityReason;
        this.availableDriversCount = availableDriversCount;
    }

    public Long getServiceId() {
        return serviceId;
    }

    public void setServiceId(Long serviceId) {
        this.serviceId = serviceId;
    }

    public String getServiceName() {
        return serviceName;
    }

    public void setServiceName(String serviceName) {
        this.serviceName = serviceName;
    }

    public VehicleType getVehicleType() {
        return vehicleType;
    }

    public void setVehicleType(VehicleType vehicleType) {
        this.vehicleType = vehicleType;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public BigDecimal getMaxCapacityKg() {
        return maxCapacityKg;
    }

    public void setMaxCapacityKg(BigDecimal maxCapacityKg) {
        this.maxCapacityKg = maxCapacityKg;
    }

    public BigDecimal getEstimatedFare() {
        return estimatedFare;
    }

    public void setEstimatedFare(BigDecimal estimatedFare) {
        this.estimatedFare = estimatedFare;
    }

    public Integer getEstimatedArrivalMinutes() {
        return estimatedArrivalMinutes;
    }

    public void setEstimatedArrivalMinutes(Integer estimatedArrivalMinutes) {
        this.estimatedArrivalMinutes = estimatedArrivalMinutes;
    }

    public Boolean getIsEligible() {
        return isEligible;
    }

    public void setIsEligible(Boolean eligible) {
        isEligible = eligible;
    }

    public String getEligibilityReason() {
        return eligibilityReason;
    }

    public void setEligibilityReason(String eligibilityReason) {
        this.eligibilityReason = eligibilityReason;
    }

    public Integer getAvailableDriversCount() {
        return availableDriversCount;
    }

    public void setAvailableDriversCount(Integer availableDriversCount) {
        this.availableDriversCount = availableDriversCount;
    }
}
