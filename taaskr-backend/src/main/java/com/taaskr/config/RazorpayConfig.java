package com.taaskr.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RazorpayConfig {

    @Value("${razorpay.key.id}")
    private String keyId;

    @Value("${razorpay.key.secret}")
    private String keySecret;

    @Bean
    public RazorpayProperties razorpayProperties() {
        return new RazorpayProperties(keyId, keySecret);
    }

    public record RazorpayProperties(
            String keyId,
            String keySecret
    ) {
    }
}