package com.taaskr.entity;

import com.taaskr.enums.VehicleType;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "vehicle_pricing_rules")
public class VehiclePricingRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "vehicle_type", nullable = false, unique = true, length = 50)
    private VehicleType vehicleType;

    @Column(name = "display_name", nullable = false, length = 100)
    private String displayName;

    @Column(name = "base_fare", nullable = false, precision = 10, scale = 2)
    private BigDecimal baseFare;

    @Column(name = "base_distance_km", nullable = false, precision = 10, scale = 2)
    private BigDecimal baseDistanceKm = new BigDecimal("2.0");

    @Column(name = "per_km_rate", nullable = false, precision = 10, scale = 2)
    private BigDecimal perKmRate;

    @Column(name = "minimum_fare", nullable = false, precision = 10, scale = 2)
    private BigDecimal minimumFare;

    @Column(name = "max_capacity_kg", nullable = false, precision = 10, scale = 2)
    private BigDecimal maxCapacityKg;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public VehiclePricingRule() {
    }

    public VehiclePricingRule(VehicleType vehicleType, String displayName, BigDecimal baseFare, BigDecimal baseDistanceKm, BigDecimal perKmRate, BigDecimal minimumFare, BigDecimal maxCapacityKg) {
        this.vehicleType = vehicleType;
        this.displayName = displayName;
        this.baseFare = baseFare;
        this.baseDistanceKm = baseDistanceKm;
        this.perKmRate = perKmRate;
        this.minimumFare = minimumFare;
        this.maxCapacityKg = maxCapacityKg;
        this.active = true;
    }

    @PrePersist
    public void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.active == null) {
            this.active = true;
        }
        if (this.baseDistanceKm == null) {
            this.baseDistanceKm = new BigDecimal("2.0");
        }
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public BigDecimal getBaseFare() {
        return baseFare;
    }

    public void setBaseFare(BigDecimal baseFare) {
        this.baseFare = baseFare;
    }

    public BigDecimal getBaseDistanceKm() {
        return baseDistanceKm;
    }

    public void setBaseDistanceKm(BigDecimal baseDistanceKm) {
        this.baseDistanceKm = baseDistanceKm;
    }

    public BigDecimal getPerKmRate() {
        return perKmRate;
    }

    public void setPerKmRate(BigDecimal perKmRate) {
        this.perKmRate = perKmRate;
    }

    public BigDecimal getMinimumFare() {
        return minimumFare;
    }

    public void setMinimumFare(BigDecimal minimumFare) {
        this.minimumFare = minimumFare;
    }

    public BigDecimal getMaxCapacityKg() {
        return maxCapacityKg;
    }

    public void setMaxCapacityKg(BigDecimal maxCapacityKg) {
        this.maxCapacityKg = maxCapacityKg;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
