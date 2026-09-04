package com.taaskr.dto.provider;

public class ProviderProfileResponse {
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

    public ProviderProfileResponse() {}

    public ProviderProfileResponse(Long id, Long userId, String name, String email, String phone,
                                   Integer experienceYears, String city, String pincode,
                                   Boolean approved, Double rating, Integer totalJobs, String bio) {
        this(id, userId, name, email, phone, experienceYears, city, pincode, approved, rating, totalJobs, bio, false, false);
    }

    public ProviderProfileResponse(Long id, Long userId, String name, String email, String phone,
                                   Integer experienceYears, String city, String pincode,
                                   Boolean approved, Double rating, Integer totalJobs, String bio,
                                   Boolean emailVerified, Boolean phoneVerified) {
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

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public Integer getExperienceYears() { return experienceYears; }
    public void setExperienceYears(Integer experienceYears) { this.experienceYears = experienceYears; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getPincode() { return pincode; }
    public void setPincode(String pincode) { this.pincode = pincode; }
    public Boolean getApproved() { return approved; }
    public void setApproved(Boolean approved) { this.approved = approved; }
    public Double getRating() { return rating; }
    public void setRating(Double rating) { this.rating = rating; }
    public Integer getTotalJobs() { return totalJobs; }
    public void setTotalJobs(Integer totalJobs) { this.totalJobs = totalJobs; }
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
    public Boolean getEmailVerified() { return emailVerified; }
    public void setEmailVerified(Boolean emailVerified) { this.emailVerified = emailVerified; }
    public Boolean getPhoneVerified() { return phoneVerified; }
    public void setPhoneVerified(Boolean phoneVerified) { this.phoneVerified = phoneVerified; }
}
