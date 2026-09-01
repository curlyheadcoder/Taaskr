package com.taaskr.event;

import java.math.BigDecimal;

public class PaymentReceivedEvent {

    private final Long bookingId;
    private final BigDecimal amount;
    private final String paymentMode; // ONLINE, CASH
    private final String transactionReference;

    public PaymentReceivedEvent(Long bookingId, BigDecimal amount, String paymentMode, String transactionReference) {
        this.bookingId = bookingId;
        this.amount = amount;
        this.paymentMode = paymentMode;
        this.transactionReference = transactionReference;
    }

    public Long getBookingId() {
        return bookingId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public String getPaymentMode() {
        return paymentMode;
    }

    public String getTransactionReference() {
        return transactionReference;
    }
}
