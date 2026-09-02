package com.taaskr.dto.vehicle;

import com.taaskr.enums.FuelType;
import com.taaskr.enums.VehicleType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class VehicleResponse {

    private Long id;
    private Long providerId;
    private String providerName;
    private VehicleType vehicleType;
    private String vehicleDisplayName;
    private FuelType fuelType;
    private String modelName;
    private String registrationNumber;
    private BigDecimal capacityKg;
    private Boolean active;
    private Boolean available;
    private BigDecimal currentLatitude;
    private BigDecimal currentLongitude;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public VehicleResponse() {
    }

    public VehicleResponse(Long id, Long providerId, String providerName, VehicleType vehicleType, String vehicleDisplayName, FuelType fuelType, String modelName, String registrationNumber, BigDecimal capacityKg, Boolean active, Boolean available, BigDecimal currentLatitude, BigDecimal currentLongitude, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.providerId = providerId;
        this.providerName = providerName;
        this.vehicleType = vehicleType;
        this.vehicleDisplayName = vehicleDisplayName;
        this.fuelType = fuelType;
        this.modelName = modelName;
        this.registrationNumber = registrationNumber;
        this.capacityKg = capacityKg;
        this.active = active;
        this.available = available;
        this.currentLatitude = currentLatitude;
        this.currentLongitude = currentLongitude;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public Long getProviderId() {
        return providerId;
    }

    public String getProviderName() {
        return providerName;
    }

    public VehicleType getVehicleType() {
        return vehicleType;
    }

    public String getVehicleDisplayName() {
        return vehicleDisplayName;
    }

    public FuelType getFuelType() {
        return fuelType;
    }

    public String getModelName() {
        return modelName;
    }

    public String getRegistrationNumber() {
        return registrationNumber;
    }

    public BigDecimal getCapacityKg() {
        return capacityKg;
    }

    public Boolean getActive() {
        return active;
    }

    public Boolean getAvailable() {
        return available;
    }

    public BigDecimal getCurrentLatitude() {
        return currentLatitude;
    }

    public BigDecimal getCurrentLongitude() {
        return currentLongitude;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
