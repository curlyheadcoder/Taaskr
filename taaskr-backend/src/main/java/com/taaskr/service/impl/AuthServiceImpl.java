package com.taaskr.service.impl;

import com.taaskr.dto.auth.AuthResponse;
import com.taaskr.dto.auth.LoginRequest;
import com.taaskr.dto.auth.MeResponse;
import com.taaskr.dto.auth.RegisterRequest;
import com.taaskr.entity.ProviderProfile;
import com.taaskr.entity.User;
import com.taaskr.enums.Role;
import com.taaskr.exception.BadRequestException;
import com.taaskr.exception.ResourceNotFoundException;
import com.taaskr.repository.ProviderProfileRepository;
import com.taaskr.repository.UserRepository;
import com.taaskr.security.JwtService;
import com.taaskr.service.AuthService;
import jakarta.transaction.Transactional;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final ProviderProfileRepository providerProfileRepository;

    public AuthServiceImpl(UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           AuthenticationManager authenticationManager,
                           JwtService jwtService,
                           ProviderProfileRepository providerProfileRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.providerProfileRepository = providerProfileRepository;
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(email)) {
            throw new BadRequestException("Email is already registered");
        }

        if (request.getRole() == null) {
            throw new BadRequestException("Role is required");
        }

        if (request.getRole() == Role.ADMIN) {
            throw new BadRequestException("Admin registration is not allowed");
        }

        User user = new User();
        user.setName(request.getName().trim());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPhone(request.getPhone());
        user.setRole(request.getRole());
        user.setCity(request.getCity());
        user.setPincode(request.getPincode());
        user.setEnabled(true);

        User savedUser = userRepository.save(user);
        /***
         * Create a provider profile for newly registered providers.
         * New Providers must be approved by admin before they can receive bookings
         */
        if (savedUser.getRole() == Role.PROVIDER) {
            ProviderProfile providerProfile = new ProviderProfile();

            providerProfile.setUser(savedUser);
            providerProfile.setExperienceYears(0);
            providerProfile.setCity(savedUser.getCity());
            providerProfile.setPincode(savedUser.getPincode());
            providerProfile.setApproved(false);
            providerProfile.setRating(0.0);
            providerProfile.setTotalJobs(0);
            providerProfile.setBio(null);

            providerProfileRepository.save(providerProfile);
        }

        UserDetails userDetails = org.springframework.security.core.userdetails.User
                .withUsername(savedUser.getEmail())
                .password(savedUser.getPassword())
                .authorities("ROLE_" + savedUser.getRole().name())
                .build();

        String token = jwtService.generateToken(userDetails);

        return new AuthResponse(
                token,
                savedUser.getId(),
                savedUser.getName(),
                savedUser.getEmail(),
                savedUser.getRole()
        );
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.getPassword())
        );

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        UserDetails userDetails = org.springframework.security.core.userdetails.User
                .withUsername(user.getEmail())
                .password(user.getPassword())
                .authorities("ROLE_" + user.getRole().name())
                .build();

        String token = jwtService.generateToken(userDetails);

        return new AuthResponse(
                token,
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole()
        );
    }

    @Override
    public MeResponse me(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return new MeResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getPhone(),
                user.getCity(),
                user.getPincode(),
                user.getEnabled()
        );
    }
}