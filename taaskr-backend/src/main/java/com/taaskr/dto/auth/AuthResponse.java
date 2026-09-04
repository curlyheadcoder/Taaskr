package com.taaskr.dto.auth;

import com.taaskr.enums.Role;

public class AuthResponse {

    private String token;
    private Long userId;
    private String name;
    private String email;
    private String phone;
    private Role role;
    private Boolean emailVerified;
    private Boolean phoneVerified;

    public AuthResponse() {
    }

    public AuthResponse(String token, Long userId, String name, String email, Role role) {
        this(token, userId, name, email, null, role, false, false);
    }

    public AuthResponse(String token, Long userId, String name, String email, Role role, Boolean emailVerified) {
        this(token, userId, name, email, null, role, emailVerified, false);
    }

    public AuthResponse(String token, Long userId, String name, String email, String phone, Role role, Boolean emailVerified, Boolean phoneVerified) {
        this.token = token;
        this.userId = userId;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.role = role;
        this.emailVerified = emailVerified;
        this.phoneVerified = phoneVerified;
    }

    public String getToken() {
        return token;
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

    public Role getRole() {
        return role;
    }

    public Boolean getEmailVerified() {
        return emailVerified;
    }

    public Boolean getPhoneVerified() {
        return phoneVerified;
    }

    public void setToken(String token) {
        this.token = token;
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

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public void setEmailVerified(Boolean emailVerified) {
        this.emailVerified = emailVerified;
    }

    public void setPhoneVerified(Boolean phoneVerified) {
        this.phoneVerified = phoneVerified;
    }
}