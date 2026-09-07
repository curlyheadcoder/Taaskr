package com.taaskr.entity;

import jakarta.persistence.*;

@Entity
@Table(name="provider_profiles")
public class ProviderProfile {
    @Id
    @GeneratedValue(strategy= GenerationType.IDENTITY)
    private Long id;
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", unique = true, nullable = false)
    private User user;
    @Column(nullable = false)
    private Integer experienceYears = 0;
    @Column(length = 100)
    private String city;
    @Column(length=20)
    private String pincode;
    @Column(nullable = false)
    private Boolean approved = false;
    @Column(nullable = false)
    private Double rating = 0.0;
    @Column(nullable = false)
    private Integer totalJobs = 0;
    @Column(nullable = false)
    private Integer totalRatings = 0;
    @Column(length= 500)
    private String bio;
    @Column(length = 1000)
    private String adminRemarks;

    @Column(precision = 10, scale = 7)
    private java.math.BigDecimal currentLatitude;

    @Column(precision = 10, scale = 7)
    private java.math.BigDecimal currentLongitude;

    @Column
    private java.time.LocalDateTime locationUpdatedAt;

    public ProviderProfile() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Integer getExperienceYears() {
        return experienceYears;
    }

    public void setExperienceYears(Integer experienceYears) {
        this.experienceYears = experienceYears;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getPincode() {
        return pincode;
    }

    public void setPincode(String pincode) {
        this.pincode = pincode;
    }

    public Boolean getApproved() {
        return approved;
    }

    public void setApproved(Boolean approved) {
        this.approved = approved;
    }

    public Double getRating() {
        return rating;
    }

    public void setRating(Double rating) {
        this.rating = rating;
    }

    public Integer getTotalJobs() {
        return totalJobs;
    }

    public void setTotalJobs(Integer totalJobs) {
        this.totalJobs = totalJobs;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public Integer getTotalRatings() {
        return totalRatings;
    }

    public void setTotalRatings(Integer totalRatings) {
        this.totalRatings = totalRatings;
    }

    public String getAdminRemarks() {
        return adminRemarks;
    }

    public void setAdminRemarks(String adminRemarks) {
        this.adminRemarks = adminRemarks;
    }

    public java.math.BigDecimal getCurrentLatitude() {
        return currentLatitude;
    }

    public void setCurrentLatitude(java.math.BigDecimal currentLatitude) {
        this.currentLatitude = currentLatitude;
    }

    public java.math.BigDecimal getCurrentLongitude() {
        return currentLongitude;
    }

    public void setCurrentLongitude(java.math.BigDecimal currentLongitude) {
        this.currentLongitude = currentLongitude;
    }

    public java.time.LocalDateTime getLocationUpdatedAt() {
        return locationUpdatedAt;
    }

    public void setLocationUpdatedAt(java.time.LocalDateTime locationUpdatedAt) {
        this.locationUpdatedAt = locationUpdatedAt;
    }
}
