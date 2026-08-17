package com.taaskr.dto.payment;

import java.math.BigDecimal;

public class PaymentOrderResponse {

    private Long paymentId;
    private Long bookingId;

    private String razorpayOrderId;

    private BigDecimal amount;
    private String currency;

    private String razorpayKeyId;

    public PaymentOrderResponse() {
    }

    public PaymentOrderResponse(
            Long paymentId,
            Long bookingId,
            String razorpayOrderId,
            BigDecimal amount,
            String currency,
            String razorpayKeyId) {

        this.paymentId = paymentId;
        this.bookingId = bookingId;
        this.razorpayOrderId = razorpayOrderId;
        this.amount = amount;
        this.currency = currency;
        this.razorpayKeyId = razorpayKeyId;
    }

    public Long getPaymentId() {
        return paymentId;
    }

    public Long getBookingId() {
        return bookingId;
    }

    public String getRazorpayOrderId() {
        return razorpayOrderId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public String getCurrency() {
        return currency;
    }

    public String getRazorpayKeyId() {
        return razorpayKeyId;
    }
}