package com.taaskr.dto.payout;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public class RequestPayoutRequest {

    @NotNull(message = "Payout amount is required")
    @DecimalMin(value = "100.00", message = "Minimum payout withdrawal is ₹100.00")
    private BigDecimal amount;

    @Size(max = 50, message = "Bank account number must not exceed 50 characters")
    @Pattern(regexp = "^[0-9]{9,18}$", message = "Bank account number must be between 9 and 18 digits (numbers only)")
    private String bankAccountNumber;

    @Size(max = 30, message = "IFSC code must not exceed 30 characters")
    @Pattern(regexp = "^[A-Z]{4}0[A-Z0-9]{6}$", message = "Invalid IFSC Code format (e.g. HDFC0001234)")
    private String bankIfsc;

    @Size(max = 100, message = "Bank name must not exceed 100 characters")
    @Pattern(regexp = "^[a-zA-Z\\s\\.\\&\\-]{2,100}$", message = "Bank name contains invalid characters")
    private String bankName;

    @Size(max = 100, message = "UPI ID must not exceed 100 characters")
    @Pattern(regexp = "^[a-zA-Z0-9.\\-_]{2,256}@[a-zA-Z][a-zA-Z0-9]{2,64}$", message = "Invalid UPI ID format (e.g. name@okhdfcbank)")
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
