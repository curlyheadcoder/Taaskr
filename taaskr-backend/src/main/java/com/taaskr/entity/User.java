package com.taaskr.entity;

import com.taaskr.enums.Role;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")

public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String name;
    @Column(nullable = false, unique = true, length = 150)
    private String email;
    @Column(nullable = false, length = 100)
    private String password;
    @Column(nullable = false, unique = true, length = 10)
    private String phone;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Role role;
    @Column(length = 100)
    private String city;

    @Column(length = 20)
    private String pincode;

    @Column(nullable = false)
    private Boolean enabled = true;

    @Column(nullable = false)
    private Boolean emailVerified = false;

    @Column(length = 10)
    private String verificationOtp;

    private LocalDateTime verificationOtpExpiresAt;

    @Column(length = 10)
    private String resetPasswordOtp;

    private LocalDateTime resetPasswordOtpExpiresAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    public void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.enabled == null) {
            this.enabled = true;
        }
        if (this.emailVerified == null) {
            this.emailVerified = false;
        }
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }

    public String getPincode() {
        return pincode;
    }

    public void setPincode(String pincode) {
        this.pincode = pincode;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Boolean getEmailVerified() {
        return emailVerified;
    }

    public void setEmailVerified(Boolean emailVerified) {
        this.emailVerified = emailVerified;
    }

    public String getVerificationOtp() {
        return verificationOtp;
    }

    public void setVerificationOtp(String verificationOtp) {
        this.verificationOtp = verificationOtp;
    }

    public LocalDateTime getVerificationOtpExpiresAt() {
        return verificationOtpExpiresAt;
    }

    public void setVerificationOtpExpiresAt(LocalDateTime verificationOtpExpiresAt) {
        this.verificationOtpExpiresAt = verificationOtpExpiresAt;
    }

    public String getResetPasswordOtp() {
        return resetPasswordOtp;
    }

    public void setResetPasswordOtp(String resetPasswordOtp) {
        this.resetPasswordOtp = resetPasswordOtp;
    }

    public LocalDateTime getResetPasswordOtpExpiresAt() {
        return resetPasswordOtpExpiresAt;
    }

    public void setResetPasswordOtpExpiresAt(LocalDateTime resetPasswordOtpExpiresAt) {
        this.resetPasswordOtpExpiresAt = resetPasswordOtpExpiresAt;
    }
}
