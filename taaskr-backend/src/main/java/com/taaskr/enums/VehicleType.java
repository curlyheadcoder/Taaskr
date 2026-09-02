package com.taaskr.enums;

public enum VehicleType {
    TWO_WHEELER_ELECTRIC("Electric Bike", 25.0),
    TWO_WHEELER_PETROL("Petrol Bike", 25.0),
    THREE_WHEELER_ELECTRIC("Electric Rickshaw", 250.0),
    LOADING_VEHICLE("Loading Vehicle (3W)", 500.0),
    MINI_TRUCK("Mini Truck (Tata Ace)", 1000.0),
    TRUCK("Truck (14ft / 17ft)", 2500.0),
    HEAVY_TRUCK("Heavy Truck", 7000.0);

    private final String displayName;
    private final double defaultCapacityKg;

    VehicleType(String displayName, double defaultCapacityKg) {
        this.displayName = displayName;
        this.defaultCapacityKg = defaultCapacityKg;
    }

    public String getDisplayName() {
        return displayName;
    }

    public double getDefaultCapacityKg() {
        return defaultCapacityKg;
    }
}
