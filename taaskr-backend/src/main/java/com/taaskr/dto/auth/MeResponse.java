package com.taaskr.dto.auth;

import com.taaskr.enums.Role;

public class MeResponse {

    private Long userId;
    private String name;
    private String email;
    private Role role;
    private String phone;
    private String city;
    private String pincode;
    private Boolean enabled;

    public MeResponse() {
    }

    public MeResponse(Long userId, String name, String email, Role role,
                      String phone, String city, String pincode, Boolean enabled) {
        this.userId = userId;
        this.name = name;
        this.email = email;
        this.role = role;
        this.phone = phone;
        this.city = city;
        this.pincode = pincode;
        this.enabled = enabled;
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

    public Role getRole() {
        return role;
    }

    public String getPhone() {
        return phone;
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

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public void setPincode(String pincode) {
        this.pincode = pincode;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }
}