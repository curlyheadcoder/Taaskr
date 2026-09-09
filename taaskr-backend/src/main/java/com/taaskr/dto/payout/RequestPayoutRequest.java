package com.taaskr.dto.payout;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public class RequestPayoutRequest {

    @NotNull(message = "Payout amount is required")
    @DecimalMin(value = "100.00", message = "Minimum payout withdrawal is ₹100.00")
    private BigDecimal amount;

    @Size(max = 50, message = "Bank account number must not exceed 50 characters")
    private String bankAccountNumber;

    @Size(max = 30, message = "IFSC code must not exceed 30 characters")
    private String bankIfsc;

    @Size(max = 100, message = "Bank name must not exceed 100 characters")
    private String bankName;

    @Size(max = 100, message = "UPI ID must not exceed 100 characters")
    private String upiId;

    @Size(max = 500, message = "Notes must not exceed 500 characters")
    private String notes;

    public RequestPayoutRequest() {
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
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

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
