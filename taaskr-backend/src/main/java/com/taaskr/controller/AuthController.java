package com.taaskr.controller;

import com.taaskr.dto.auth.*;
import com.taaskr.service.AuthService;
import com.taaskr.service.EmailService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final EmailService emailService;

    public AuthController(AuthService authService, EmailService emailService) {
        this.authService = authService;
        this.emailService = emailService;
    }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public MeResponse me(Authentication authentication) {
        if (authentication == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.UNAUTHORIZED, "User not authenticated");
        }
        return authService.me(authentication.getName());
    }

    @PostMapping("/send-verification-otp")
    public AuthMessageResponse sendVerificationOtp(@Valid @RequestBody ForgotPasswordRequest request) {
        return authService.sendVerificationOtp(request.getEmail());
    }

    @PostMapping("/verify-email")
    public AuthMessageResponse verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        return authService.verifyEmail(request);
    }

    @PostMapping("/forgot-password")
    public AuthMessageResponse forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return authService.forgotPassword(request);
    }

    @PostMapping("/reset-password")
    public AuthMessageResponse resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        return authService.resetPassword(request);
    }

    @PostMapping("/resend-otp")
    public AuthMessageResponse resendOtp(@Valid @RequestBody SendOtpRequest request) {
        return authService.resendOtp(request);
    }

    @GetMapping("/test-email")
    public Map<String, Object> testEmail(@RequestParam(defaultValue = "mayanksonwani078@gmail.com") String to) {
        return emailService.testEmailDispatch(to);
    }
}
