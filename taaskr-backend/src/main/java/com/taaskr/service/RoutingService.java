package com.taaskr.service;

import com.taaskr.dto.routing.RoutingResult;

import java.math.BigDecimal;

public interface RoutingService {
    RoutingResult calculateRoute(BigDecimal originLat, BigDecimal originLng, BigDecimal destLat, BigDecimal destLng, Long bookingId);
    void clearBookingCache(Long bookingId);
}
