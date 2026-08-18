package com.taaskr.dto.provider;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class UpdateProviderProfileRequest {
    @NotBlank(message = "Name is required")
    private String name;
    private String phone;
    @NotNull(message = "Experience years is required")
    @Min(value = 0, message = "Experience cannot be negative")
    private Integer experienceYears;
    private String city;
    private String pincode;
    private String bio;

    public UpdateProviderProfileRequest() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public Integer getExperienceYears() { return experienceYears; }
    public void setExperienceYears(Integer experienceYears) { this.experienceYears = experienceYears; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getPincode() { return pincode; }
    public void setPincode(String pincode) { this.pincode = pincode; }
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
}
