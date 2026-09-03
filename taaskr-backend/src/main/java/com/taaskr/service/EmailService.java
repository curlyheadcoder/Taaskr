package com.taaskr.service;

public interface EmailService {
    void sendVerificationOtp(String toEmail, String userName, String otp);
    void sendPasswordResetOtp(String toEmail, String userName, String otp);
    void sendWelcomeEmail(String toEmail, String userName);
}
