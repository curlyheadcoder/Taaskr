package com.taaskr.service.impl;

import com.taaskr.service.SmsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Service
public class SmsServiceImpl implements SmsService {

    private static final Logger log = LoggerFactory.getLogger(SmsServiceImpl.class);
    private static final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    @Value("${app.sms.simulation-mode:${SMS_SIMULATION_MODE:auto}}")
    private String simulationMode;

    @Value("${fast2sms.api.key:${FAST2SMS_API_KEY:}}")
    private String fast2smsApiKey;

    @Value("${twilio.account.sid:${TWILIO_ACCOUNT_SID:}}")
    private String twilioSid;

    @Value("${twilio.auth.token:${TWILIO_AUTH_TOKEN:}}")
    private String twilioAuthToken;

    @Value("${twilio.phone.number:${TWILIO_PHONE_NUMBER:}}")
    private String twilioPhone;

    @Override
    @Async
    public void sendPhoneVerificationOtp(String phone, String userName, String otp) {
        String cleanPhone = phone != null ? phone.trim() : "";
        String message = String.format("Taaskr Verification: Hello %s, your phone verification code is %s. Valid for 15 minutes.",
                userName != null && !userName.isBlank() ? userName : "User", otp);

        log.info("========== [TAASKR SMS DISPATCHER] ==========");
        log.info("To: {}", cleanPhone);
        log.info("Message: {}", message);
        log.info("Code: {}", otp);
        log.info("===============================================");

        if (fast2smsApiKey != null && !fast2smsApiKey.isBlank()) {
            try {
                sendViaFast2Sms(cleanPhone, otp);
                log.info("SUCCESS: SMS OTP dispatched via Fast2SMS to: {}", cleanPhone);
                return;
            } catch (Exception e) {
                log.warn("Fast2SMS dispatch failed: {}", e.getMessage());
            }
        }

        log.info("[SMS FALLBACK] SMS OTP logged to console for phone: {}", cleanPhone);
    }

    private void sendViaFast2Sms(String phone, String otp) throws Exception {
        String digits = phone.replaceAll("[^0-9]", "");
        if (digits.length() > 10) {
            digits = digits.substring(digits.length() - 10);
        }

        String json = String.format("{\"variables_values\":\"%s\",\"route\":\"otp\",\"numbers\":\"%s\"}", otp, digits);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://www.fast2sms.com/dev/bulkV2"))
                .header("Content-Type", "application/json")
                .header("authorization", fast2smsApiKey.trim())
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .timeout(Duration.ofSeconds(6))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new RuntimeException("Fast2SMS HTTP " + response.statusCode() + ": " + response.body());
        }
    }

    @Override
    public Map<String, Object> testSmsDispatch(String phone) {
        Map<String, Object> result = new HashMap<>();
        result.put("phone", phone);
        result.put("hasFast2SmsApiKey", fast2smsApiKey != null && !fast2smsApiKey.isBlank());
        result.put("hasTwilioConfig", twilioSid != null && !twilioSid.isBlank());
        result.put("status", "SUCCESS");
        result.put("message", "Simulated SMS test completed. Check backend console logs for payload.");
        return result;
    }
}
