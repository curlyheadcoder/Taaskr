package com.taaskr.service.impl;

import com.taaskr.service.MapService;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class MapServiceImpl implements MapService {

    private static final double EARTH_RADIUS_KM = 6371.0;
    // Road winding factor (approximate city transit distance is ~1.25x straight-line Euclidean/Haversine)
    private static final double CITY_ROAD_FACTOR = 1.25;

    @Override
    public BigDecimal calculateDistanceKm(BigDecimal pickupLat, BigDecimal pickupLng, BigDecimal dropLat, BigDecimal dropLng) {
        if (pickupLat == null || pickupLng == null || dropLat == null || dropLng == null) {
            return BigDecimal.valueOf(5.0); // Default reasonable intra-city distance if GPS absent
        }

        double lat1 = Math.toRadians(pickupLat.doubleValue());
        double lon1 = Math.toRadians(pickupLng.doubleValue());
        double lat2 = Math.toRadians(dropLat.doubleValue());
        double lon2 = Math.toRadians(dropLng.doubleValue());

        double dlat = lat2 - lat1;
        double dlon = lon2 - lon1;

        double a = Math.sin(dlat / 2) * Math.sin(dlat / 2)
                + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlon / 2) * Math.sin(dlon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        double straightLineKm = EARTH_RADIUS_KM * c;
        double estimatedRoadKm = Math.max(1.0, straightLineKm * CITY_ROAD_FACTOR);

        return BigDecimal.valueOf(estimatedRoadKm).setScale(2, RoundingMode.HALF_UP);
    }

    @Override
    public BigDecimal estimateDistanceKm(String pickupCity, String pickupPincode, String dropCity, String dropPincode) {
        if (pickupPincode != null && dropPincode != null && pickupPincode.equalsIgnoreCase(dropPincode)) {
            return BigDecimal.valueOf(3.5).setScale(2, RoundingMode.HALF_UP);
        }
        if (pickupCity != null && dropCity != null && pickupCity.equalsIgnoreCase(dropCity)) {
            return BigDecimal.valueOf(8.0).setScale(2, RoundingMode.HALF_UP);
        }
        return BigDecimal.valueOf(12.0).setScale(2, RoundingMode.HALF_UP);
    }
}
