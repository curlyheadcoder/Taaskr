package com.taaskr.dto.provider;

import java.time.LocalDate;
import java.time.LocalTime;

public class AvailabilityResponse {

    private Long id;
    private LocalDate availableDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private Boolean booked;

    public AvailabilityResponse() {
    }

    public AvailabilityResponse(Long id, LocalDate availableDate, LocalTime startTime, LocalTime endTime, Boolean booked) {
        this.id = id;
        this.availableDate = availableDate;
        this.startTime = startTime;
        this.endTime = endTime;
        this.booked = booked;
    }

    public Long getId() {
        return id;
    }

    public LocalDate getAvailableDate() {
        return availableDate;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public Boolean getBooked() {
        return booked;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setAvailableDate(LocalDate availableDate) {
        this.availableDate = availableDate;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }

    public void setBooked(Boolean booked) {
        this.booked = booked;
    }
}