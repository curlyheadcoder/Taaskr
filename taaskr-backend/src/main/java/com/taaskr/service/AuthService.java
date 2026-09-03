package com.taaskr.service;

import com.taaskr.dto.auth.*;
import org.springframework.stereotype.Service;

@Service
public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    MeResponse me(String email);
    AuthMessageResponse sendVerificationOtp(String email);
    AuthMessageResponse verifyEmail(VerifyEmailRequest request);
    AuthMessageResponse forgotPassword(ForgotPasswordRequest request);
    AuthMessageResponse resetPassword(ResetPasswordRequest request);
    AuthMessageResponse resendOtp(SendOtpRequest request);
}
