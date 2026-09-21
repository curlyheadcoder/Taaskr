package com.taaskr.dto.routing;

import java.math.BigDecimal;

public class RoutingResult {
    private BigDecimal distanceKm;
    private Integer estimatedEtaMinutes;
    private Long durationSeconds;
    private Double distanceMeters;
    private String routeSource; // OSRM, HAVERSINE_FALLBACK, NO_LOCATION
    private boolean isFresh;

    public RoutingResult() {
    }

    public RoutingResult(BigDecimal distanceKm, Integer estimatedEtaMinutes, Long durationSeconds, Double distanceMeters, String routeSource, boolean isFresh) {
        this.distanceKm = distanceKm;
        this.estimatedEtaMinutes = estimatedEtaMinutes;
        this.durationSeconds = durationSeconds;
        this.distanceMeters = distanceMeters;
        this.routeSource = routeSource;
        this.isFresh = isFresh;
    }

    public BigDecimal getDistanceKm() {
        return distanceKm;
    }

    public void setDistanceKm(BigDecimal distanceKm) {
        this.distanceKm = distanceKm;
    }

    public Integer getEstimatedEtaMinutes() {
        return estimatedEtaMinutes;
    }

    public void setEstimatedEtaMinutes(Integer estimatedEtaMinutes) {
        this.estimatedEtaMinutes = estimatedEtaMinutes;
    }

    public Long getDurationSeconds() {
        return durationSeconds;
    }

    public void setDurationSeconds(Long durationSeconds) {
        this.durationSeconds = durationSeconds;
    }

    public Double getDistanceMeters() {
        return distanceMeters;
    }

    public void setDistanceMeters(Double distanceMeters) {
        this.distanceMeters = distanceMeters;
    }

    public String getRouteSource() {
        return routeSource;
    }

    public void setRouteSource(String routeSource) {
        this.routeSource = routeSource;
    }

    public boolean isFresh() {
        return isFresh;
    }

    public void setFresh(boolean fresh) {
        isFresh = fresh;
    }
}
