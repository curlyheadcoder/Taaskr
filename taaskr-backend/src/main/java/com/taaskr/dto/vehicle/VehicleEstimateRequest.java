package com.taaskr.dto.vehicle;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class VehicleEstimateRequest {

    @NotBlank(message = "Pickup city is required")
    private String pickupCity;

    private String pickupPincode;

    private BigDecimal pickupLatitude;

    private BigDecimal pickupLongitude;

    @NotBlank(message = "Drop city is required")
    private String dropCity;

    private String dropPincode;

    private BigDecimal dropLatitude;

    private BigDecimal dropLongitude;

    @NotNull(message = "Package weight is required")
    @DecimalMin(value = "0.1", message = "Package weight must be at least 0.1 KG")
    private BigDecimal packageWeightKg;

    private String packageDescription;

    public String getPickupCity() {
        return pickupCity;
    }

    public void setPickupCity(String pickupCity) {
        this.pickupCity = pickupCity;
    }

    public String getPickupPincode() {
        return pickupPincode;
    }

    public void setPickupPincode(String pickupPincode) {
        this.pickupPincode = pickupPincode;
    }

    public BigDecimal getPickupLatitude() {
        return pickupLatitude;
    }

    public void setPickupLatitude(BigDecimal pickupLatitude) {
        this.pickupLatitude = pickupLatitude;
    }

    public BigDecimal getPickupLongitude() {
        return pickupLongitude;
    }

    public void setPickupLongitude(BigDecimal pickupLongitude) {
        this.pickupLongitude = pickupLongitude;
    }

    public String getDropCity() {
        return dropCity;
    }

    public void setDropCity(String dropCity) {
        this.dropCity = dropCity;
    }

    public String getDropPincode() {
        return dropPincode;
    }

    public void setDropPincode(String dropPincode) {
        this.dropPincode = dropPincode;
    }

    public BigDecimal getDropLatitude() {
        return dropLatitude;
    }

    public void setDropLatitude(BigDecimal dropLatitude) {
        this.dropLatitude = dropLatitude;
    }

    public BigDecimal getDropLongitude() {
        return dropLongitude;
    }

    public void setDropLongitude(BigDecimal dropLongitude) {
        this.dropLongitude = dropLongitude;
    }

    public BigDecimal getPackageWeightKg() {
        return packageWeightKg;
    }

    public void setPackageWeightKg(BigDecimal packageWeightKg) {
        this.packageWeightKg = packageWeightKg;
    }

    public String getPackageDescription() {
        return packageDescription;
    }

    public void setPackageDescription(String packageDescription) {
        this.packageDescription = packageDescription;
    }
}
