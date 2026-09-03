package com.taaskr.dto.auth;

import com.taaskr.enums.Role;

public class AuthResponse {

    private String token;
    private Long userId;
    private String name;
    private String email;
    private Role role;
    private Boolean emailVerified;

    public AuthResponse() {
    }

    public AuthResponse(String token, Long userId, String name, String email, Role role) {
        this(token, userId, name, email, role, false);
    }

    public AuthResponse(String token, Long userId, String name, String email, Role role, Boolean emailVerified) {
        this.token = token;
        this.userId = userId;
        this.name = name;
        this.email = email;
        this.role = role;
        this.emailVerified = emailVerified;
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

    public Role getRole() {
        return role;
    }

    public Boolean getEmailVerified() {
        return emailVerified;
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

    public void setRole(Role role) {
        this.role = role;
    }

    public void setEmailVerified(Boolean emailVerified) {
        this.emailVerified = emailVerified;
    }
}