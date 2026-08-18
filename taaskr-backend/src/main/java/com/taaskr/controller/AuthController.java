package com.taaskr.controller;

import com.taaskr.dto.auth.AuthResponse;
import com.taaskr.dto.auth.LoginRequest;
import com.taaskr.dto.auth.MeResponse;
import com.taaskr.dto.auth.RegisterRequest;
import com.taaskr.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    public AuthController(AuthService authService) {
        this.authService = authService;
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
}
