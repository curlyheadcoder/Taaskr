package com.taaskr.service;

import com.taaskr.dto.payment.CreatePaymentOrderRequest;
import com.taaskr.dto.payment.PaymentOrderResponse;
import com.taaskr.dto.payment.VerifyPaymentRequest;

public interface PaymentService {
    PaymentOrderResponse createPaymentOrder(String userEmail, CreatePaymentOrderRequest request);

    PaymentOrderResponse verifyPayment(String userEmail, VerifyPaymentRequest request);
}
