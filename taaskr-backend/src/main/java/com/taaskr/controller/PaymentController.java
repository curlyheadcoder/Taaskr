package com.taaskr.controller;

import com.taaskr.dto.payment.CreatePaymentOrderRequest;
import com.taaskr.dto.payment.PaymentOrderResponse;
import com.taaskr.dto.payment.VerifyPaymentRequest;
import com.taaskr.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments")
@PreAuthorize("hasRole('USER')")
public class PaymentController {

    private final PaymentService paymentService;
    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/orders")
    public PaymentOrderResponse createPaymentOrder(
            @Valid @RequestBody CreatePaymentOrderRequest request,
            Authentication authentication
    )
    {
        return paymentService.createPaymentOrder(
                authentication.getName(),
                request
        );
    }

    @PostMapping("/verify")
    public PaymentOrderResponse verifyPayment(
            @Valid @RequestBody VerifyPaymentRequest request,
            Authentication authentication
    ){
        return paymentService.verifyPayment(
                authentication.getName(),
                request
        );
    }
}
