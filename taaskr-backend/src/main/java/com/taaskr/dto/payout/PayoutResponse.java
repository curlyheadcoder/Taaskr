package com.taaskr.dto.payout;

import com.taaskr.enums.PayoutStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PayoutResponse {

    private Long id;
    private Long providerId;
    private String providerName;
    private BigDecimal amount;
    private PayoutStatus status;
    private String bankAccountNumber;
    private String bankIfsc;
    private String bankName;
    private String upiId;
    private String adminNotes;
    private String transactionReference;
    private LocalDateTime requestedAt;
    private LocalDateTime processedAt;

    public PayoutResponse() {
    }

    public PayoutResponse(Long id, Long providerId, String providerName, BigDecimal amount, PayoutStatus status, String bankAccountNumber, String bankIfsc, String bankName, String upiId, String adminNotes, String transactionReference, LocalDateTime requestedAt, LocalDateTime processedAt) {
        this.id = id;
        this.providerId = providerId;
        this.providerName = providerName;
        this.amount = amount;
        this.status = status;
        this.bankAccountNumber = bankAccountNumber;
        this.bankIfsc = bankIfsc;
        this.bankName = bankName;
        this.upiId = upiId;
        this.adminNotes = adminNotes;
        this.transactionReference = transactionReference;
        this.requestedAt = requestedAt;
        this.processedAt = processedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getProviderId() {
        return providerId;
    }

    public void setProviderId(Long providerId) {
        this.providerId = providerId;
    }

    public String getProviderName() {
        return providerName;
    }

    public void setProviderName(String providerName) {
        this.providerName = providerName;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public PayoutStatus getStatus() {
        return status;
    }

    public void setStatus(PayoutStatus status) {
        this.status = status;
    }

    public String getBankAccountNumber() {
        return bankAccountNumber;
    }

    public void setBankAccountNumber(String bankAccountNumber) {
        this.bankAccountNumber = bankAccountNumber;
    }

    public String getBankIfsc() {
        return bankIfsc;
    }

    public void setBankIfsc(String bankIfsc) {
        this.bankIfsc = bankIfsc;
    }

    public String getBankName() {
        return bankName;
    }

    public void setBankName(String bankName) {
        this.bankName = bankName;
    }

    public String getUpiId() {
        return upiId;
    }

    public void setUpiId(String upiId) {
        this.upiId = upiId;
    }

    public String getAdminNotes() {
        return adminNotes;
    }

    public void setAdminNotes(String adminNotes) {
        this.adminNotes = adminNotes;
    }

    public String getTransactionReference() {
        return transactionReference;
    }

    public void setTransactionReference(String transactionReference) {
        this.transactionReference = transactionReference;
    }

    public LocalDateTime getRequestedAt() {
        return requestedAt;
    }

    public void setRequestedAt(LocalDateTime requestedAt) {
        this.requestedAt = requestedAt;
    }

    public LocalDateTime getProcessedAt() {
        return processedAt;
    }

    public void setProcessedAt(LocalDateTime processedAt) {
        this.processedAt = processedAt;
    }
}
