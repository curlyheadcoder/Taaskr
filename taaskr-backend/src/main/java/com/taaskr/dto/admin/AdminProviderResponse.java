package com.taaskr.dto.admin;

public class AdminProviderResponse {

    private Long id;
    private Long userId;
    private String name;
    private String email;
    private String phone;
    private Integer experienceYears;
    private String city;
    private String pincode;
    private Boolean approved;
    private Double rating;
    private Integer totalJobs;
    private String bio;
    private Boolean emailVerified;
    private Boolean phoneVerified;

    public AdminProviderResponse() {
    }

    public AdminProviderResponse(Long id,
                                 Long userId,
                                 String name,
                                 String email,
                                 String phone,
                                 Integer experienceYears,
                                 String city,
                                 String pincode,
                                 Boolean approved,
                                 Double rating,
                                 Integer totalJobs,
                                 String bio) {
        this(id, userId, name, email, phone, experienceYears, city, pincode, approved, rating, totalJobs, bio, false, false);
    }

    public AdminProviderResponse(Long id,
                                 Long userId,
                                 String name,
                                 String email,
                                 String phone,
                                 Integer experienceYears,
                                 String city,
                                 String pincode,
                                 Boolean approved,
                                 Double rating,
                                 Integer totalJobs,
                                 String bio,
                                 Boolean emailVerified,
                                 Boolean phoneVerified) {
        this.id = id;
        this.userId = userId;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.experienceYears = experienceYears;
        this.city = city;
        this.pincode = pincode;
        this.approved = approved;
        this.rating = rating;
        this.totalJobs = totalJobs;
        this.bio = bio;
        this.emailVerified = emailVerified;
        this.phoneVerified = phoneVerified;
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public String getPhone() {
        return phone;
    }

    public Integer getExperienceYears() {
        return experienceYears;
    }

    public String getCity() {
        return city;
    }

    public String getPincode() {
        return pincode;
    }

    public Boolean getApproved() {
        return approved;
    }

    public Double getRating() {
        return rating;
    }

    public Integer getTotalJobs() {
        return totalJobs;
    }

    public String getBio() {
        return bio;
    }

    public Boolean getEmailVerified() {
        return emailVerified;
    }

    public Boolean getPhoneVerified() {
        return phoneVerified;
    }

    public void setEmailVerified(Boolean emailVerified) {
        this.emailVerified = emailVerified;
    }

    public void setPhoneVerified(Boolean phoneVerified) {
        this.phoneVerified = phoneVerified;
    }
}