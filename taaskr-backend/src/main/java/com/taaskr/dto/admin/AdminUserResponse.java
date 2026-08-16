package com.taaskr.dto.admin;

import com.taaskr.enums.Role;

import java.time.LocalDateTime;

public class AdminUserResponse {

    private Long id;
    private String name;
    private String email;
    private String phone;
    private Role role;
    private String city;
    private String pincode;
    private Boolean enabled;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public AdminUserResponse() {
    }

    public AdminUserResponse(Long id,
                             String name,
                             String email,
                             String phone,
                             Role role,
                             String city,
                             String pincode,
                             Boolean enabled,
                             LocalDateTime createdAt,
                             LocalDateTime updatedAt) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.role = role;
        this.city = city;
        this.pincode = pincode;
        this.enabled = enabled;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
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

    public Role getRole() {
        return role;
    }

    public String getCity() {
        return city;
    }

    public String getPincode() {
        return pincode;
    }

    public Boolean getEnabled() {
        return enabled;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}