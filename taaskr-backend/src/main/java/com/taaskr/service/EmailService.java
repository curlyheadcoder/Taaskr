package com.taaskr.service;

import java.util.Map;

public interface EmailService {
    void sendVerificationOtp(String toEmail, String userName, String otp);
    void sendPasswordResetOtp(String toEmail, String userName, String otp);
    void sendWelcomeEmail(String toEmail, String userName);
    Map<String, Object> testEmailDispatch(String toEmail);
}
