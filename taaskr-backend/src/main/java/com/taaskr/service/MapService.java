package com.taaskr.service;

import java.math.BigDecimal;

public interface MapService {
    /**
     * Calculate road/straight-line distance estimate in KM between pickup and drop coordinates.
     */
    BigDecimal calculateDistanceKm(BigDecimal pickupLat, BigDecimal pickupLng, BigDecimal dropLat, BigDecimal dropLng);

    /**
     * Calculate pure straight-line Haversine physical distance in KM (without road-winding factor).
     */
    BigDecimal calculateStraightLineDistanceKm(BigDecimal pickupLat, BigDecimal pickupLng, BigDecimal dropLat, BigDecimal dropLng);

    /**
     * Approximate distance in KM between pickup and drop locations using city/pincode if coordinates are missing.
     */
    BigDecimal estimateDistanceKm(String pickupCity, String pickupPincode, String dropCity, String dropPincode);
}
