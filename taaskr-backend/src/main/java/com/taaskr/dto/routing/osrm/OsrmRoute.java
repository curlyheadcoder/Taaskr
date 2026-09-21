package com.taaskr.dto.routing.osrm;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class OsrmRoute {
    private Double distance; // in meters
    private Double duration; // in seconds

    public OsrmRoute() {
    }

    public OsrmRoute(Double distance, Double duration) {
        this.distance = distance;
        this.duration = duration;
    }

    public Double getDistance() {
        return distance;
    }

    public void setDistance(Double distance) {
        this.distance = distance;
    }

    public Double getDuration() {
        return duration;
    }

    public void setDuration(Double duration) {
        this.duration = duration;
    }
}
