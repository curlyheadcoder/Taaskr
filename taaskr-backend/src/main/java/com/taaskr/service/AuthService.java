package com.taaskr.service;

import com.taaskr.dto.auth.AuthResponse;
import com.taaskr.dto.auth.LoginRequest;
import com.taaskr.dto.auth.MeResponse;
import com.taaskr.dto.auth.RegisterRequest;
import org.springframework.stereotype.Service;

@Service
public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    MeResponse me(String email);
}
