package com.taaskr;

import com.taaskr.dto.auth.*;
import com.taaskr.entity.User;
import com.taaskr.enums.Role;
import com.taaskr.repository.UserRepository;
import com.taaskr.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class AuthVerificationTests {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        userRepository.findByEmail("verify_test_user@example.com").ifPresent(userRepository::delete);
    }

    @Test
    void testEmailAndPhoneVerificationFlow() {
        // 1. Register a new user
        RegisterRequest registerReq = new RegisterRequest();
        registerReq.setName("Verify Test User");
        registerReq.setEmail("verify_test_user@example.com");
        registerReq.setPassword("Password123!");
        registerReq.setPhone("9988776655");
        registerReq.setRole(Role.USER);
        registerReq.setCity("Mumbai");
        registerReq.setPincode("400001");

        AuthResponse authRes = authService.register(registerReq);
        assertNotNull(authRes);
        assertNotNull(authRes.getToken());
        assertFalse(authRes.getEmailVerified());
        assertFalse(authRes.getPhoneVerified());

        // Verify entity state
        User user = userRepository.findByEmail("verify_test_user@example.com")
                .orElseThrow();
        assertNotNull(user.getVerificationOtp());
        assertFalse(user.getEmailVerified());
        assertFalse(user.getPhoneVerified());

        // 2. Verify Email with valid OTP
        String emailOtp = user.getVerificationOtp();
        AuthMessageResponse emailVerifyRes = authService.verifyEmail(
                new VerifyEmailRequest("verify_test_user@example.com", emailOtp)
        );
        assertTrue(emailVerifyRes.isSuccess());

        User verifiedEmailUser = userRepository.findByEmail("verify_test_user@example.com").orElseThrow();
        assertTrue(verifiedEmailUser.getEmailVerified());
        assertNull(verifiedEmailUser.getVerificationOtp());

        // 3. Request Phone OTP
        AuthMessageResponse phoneOtpRes = authService.sendPhoneOtp(
                new SendPhoneOtpRequest("9988776655"), "verify_test_user@example.com"
        );
        assertTrue(phoneOtpRes.isSuccess());
        assertNotNull(phoneOtpRes.getOtp());

        User userWithPhoneOtp = userRepository.findByEmail("verify_test_user@example.com").orElseThrow();
        assertNotNull(userWithPhoneOtp.getPhoneVerificationOtp());
        assertEquals(phoneOtpRes.getOtp(), userWithPhoneOtp.getPhoneVerificationOtp());

        // 4. Verify Phone with valid OTP
        AuthMessageResponse phoneVerifyRes = authService.verifyPhone(
                new VerifyPhoneRequest("9988776655", phoneOtpRes.getOtp()), "verify_test_user@example.com"
        );
        assertTrue(phoneVerifyRes.isSuccess());

        User fullyVerifiedUser = userRepository.findByEmail("verify_test_user@example.com").orElseThrow();
        assertTrue(fullyVerifiedUser.getEmailVerified());
        assertTrue(fullyVerifiedUser.getPhoneVerified());
        assertNull(fullyVerifiedUser.getPhoneVerificationOtp());

        // 5. Test me() endpoint reflects both verified flags
        MeResponse meRes = authService.me("verify_test_user@example.com");
        assertTrue(meRes.getEmailVerified());
        assertTrue(meRes.getPhoneVerified());
    }
}
