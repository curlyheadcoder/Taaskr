package com.taaskr.service;

import java.util.Map;

public interface SmsService {
    void sendPhoneVerificationOtp(String phone, String userName, String otp);
    Map<String, Object> testSmsDispatch(String phone);
}
