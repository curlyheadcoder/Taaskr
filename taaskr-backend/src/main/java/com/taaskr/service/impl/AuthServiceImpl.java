package com.taaskr.service.impl;

import com.taaskr.dto.auth.*;
import com.taaskr.entity.ProviderCategory;
import com.taaskr.entity.ProviderProfile;
import com.taaskr.entity.User;
import com.taaskr.enums.Role;
import com.taaskr.exception.BadRequestException;
import com.taaskr.exception.ResourceNotFoundException;
import com.taaskr.repository.ProviderCategoryRepository;
import com.taaskr.repository.ProviderProfileRepository;
import com.taaskr.repository.ServiceCategoryRepository;
import com.taaskr.repository.UserRepository;
import com.taaskr.security.JwtService;
import com.taaskr.service.AuthService;
import com.taaskr.service.EmailService;
import jakarta.transaction.Transactional;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
public class AuthServiceImpl implements AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final ProviderProfileRepository providerProfileRepository;
    private final ProviderCategoryRepository providerCategoryRepository;
    private final ServiceCategoryRepository serviceCategoryRepository;
    private final EmailService emailService;
    private final SecureRandom secureRandom = new SecureRandom();

    public AuthServiceImpl(UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           AuthenticationManager authenticationManager,
                           JwtService jwtService,
                           ProviderProfileRepository providerProfileRepository,
                           ProviderCategoryRepository providerCategoryRepository,
                           ServiceCategoryRepository serviceCategoryRepository,
                           EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.providerProfileRepository = providerProfileRepository;
        this.providerCategoryRepository = providerCategoryRepository;
        this.serviceCategoryRepository = serviceCategoryRepository;
        this.emailService = emailService;
    }

    private String generateOtp() {
        int code = 100000 + secureRandom.nextInt(900000);
        return String.valueOf(code);
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

        String otp = generateOtp();
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(15);

        User user = new User();
        user.setName(request.getName().trim());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPhone(request.getPhone());
        user.setRole(request.getRole());
        user.setCity(request.getCity());
        user.setPincode(request.getPincode());
        user.setEnabled(true);
        user.setEmailVerified(false);
        user.setVerificationOtp(otp);
        user.setVerificationOtpExpiresAt(expiresAt);

        User savedUser = userRepository.save(user);

        // Send verification email
        try {
            emailService.sendVerificationOtp(savedUser.getEmail(), savedUser.getName(), otp);
        } catch (Exception e) {
            log.error("Failed to send verification email to {}: {}", savedUser.getEmail(), e.getMessage(), e);
        }

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
            providerProfile.setBio(Boolean.TRUE.equals(request.getIsLogisticsProvider())
                    ? "Logistics & On-Demand Vehicle Transport Partner"
                    : null);

            ProviderProfile savedProfile = providerProfileRepository.save(providerProfile);

            if (Boolean.TRUE.equals(request.getIsLogisticsProvider())) {
                serviceCategoryRepository.findAll().stream()
                        .filter(c -> c.getName() != null && (c.getName().toLowerCase().contains("vehicle") || c.getName().toLowerCase().contains("transport")))
                        .findFirst()
                        .ifPresent(cat -> {
                            ProviderCategory pc = new ProviderCategory(savedProfile, cat);
                            providerCategoryRepository.save(pc);
                        });
            }
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
                savedUser.getRole(),
                Boolean.TRUE.equals(savedUser.getEmailVerified())
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
                user.getRole(),
                Boolean.TRUE.equals(user.getEmailVerified())
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
                user.getEnabled(),
                Boolean.TRUE.equals(user.getEmailVerified())
        );
    }

    @Override
    @Transactional
    public AuthMessageResponse sendVerificationOtp(String email) {
        String normalizedEmail = email.trim().toLowerCase();
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + normalizedEmail));

        if (Boolean.TRUE.equals(user.getEmailVerified())) {
            return new AuthMessageResponse(true, "Email is already verified", normalizedEmail);
        }

        String otp = generateOtp();
        user.setVerificationOtp(otp);
        user.setVerificationOtpExpiresAt(LocalDateTime.now().plusMinutes(15));
        userRepository.save(user);

        emailService.sendVerificationOtp(user.getEmail(), user.getName(), otp);

        return new AuthMessageResponse(true, "Verification code sent to " + normalizedEmail, normalizedEmail);
    }

    @Override
    @Transactional
    public AuthMessageResponse verifyEmail(VerifyEmailRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        if (Boolean.TRUE.equals(user.getEmailVerified())) {
            return new AuthMessageResponse(true, "Email is already verified", email);
        }

        if (user.getVerificationOtp() == null || user.getVerificationOtpExpiresAt() == null) {
            throw new BadRequestException("No verification request found. Please request a new verification code.");
        }

        if (LocalDateTime.now().isAfter(user.getVerificationOtpExpiresAt())) {
            throw new BadRequestException("Verification code has expired. Please request a new code.");
        }

        if (!user.getVerificationOtp().trim().equals(request.getOtp().trim())) {
            throw new BadRequestException("Invalid verification code. Please check and try again.");
        }

        user.setEmailVerified(true);
        user.setVerificationOtp(null);
        user.setVerificationOtpExpiresAt(null);
        userRepository.save(user);

        try {
            emailService.sendWelcomeEmail(user.getEmail(), user.getName());
        } catch (Exception e) {
            // Ignore email notification failure
        }

        return new AuthMessageResponse(true, "Email verified successfully!", email);
    }

    @Override
    @Transactional
    public AuthMessageResponse forgotPassword(ForgotPasswordRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("No account found with email: " + email));

        String otp = generateOtp();
        user.setResetPasswordOtp(otp);
        user.setResetPasswordOtpExpiresAt(LocalDateTime.now().plusMinutes(15));
        userRepository.save(user);

        emailService.sendPasswordResetOtp(user.getEmail(), user.getName(), otp);

        return new AuthMessageResponse(true, "Password reset OTP sent to " + email, email);
    }

    @Override
    @Transactional
    public AuthMessageResponse resetPassword(ResetPasswordRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("No account found with email: " + email));

        if (user.getResetPasswordOtp() == null || user.getResetPasswordOtpExpiresAt() == null) {
            throw new BadRequestException("No password reset requested or code already used. Please request a new reset code.");
        }

        if (LocalDateTime.now().isAfter(user.getResetPasswordOtpExpiresAt())) {
            throw new BadRequestException("Password reset code has expired. Please request a new code.");
        }

        if (!user.getResetPasswordOtp().trim().equals(request.getOtp().trim())) {
            throw new BadRequestException("Invalid password reset code. Please check and try again.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setResetPasswordOtp(null);
        user.setResetPasswordOtpExpiresAt(null);
        userRepository.save(user);

        return new AuthMessageResponse(true, "Password reset successfully! You can now sign in with your new password.", email);
    }

    @Override
    @Transactional
    public AuthMessageResponse resendOtp(SendOtpRequest request) {
        if ("RESET_PASSWORD".equalsIgnoreCase(request.getType())) {
            return forgotPassword(new ForgotPasswordRequest(request.getEmail()));
        } else {
            return sendVerificationOtp(request.getEmail());
        }
    }
}