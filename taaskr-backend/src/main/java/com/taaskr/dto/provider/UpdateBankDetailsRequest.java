package com.taaskr.dto.provider;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class UpdateBankDetailsRequest {

    @Size(max = 50, message = "Bank account number cannot exceed 50 characters")
    @Pattern(regexp = "^[0-9]{9,18}$", message = "Bank account number must be between 9 and 18 digits (numbers only)")
    private String bankAccountNumber;

    @Size(max = 20, message = "Bank IFSC cannot exceed 20 characters")
    @Pattern(regexp = "^[A-Z]{4}0[A-Z0-9]{6}$", message = "Invalid IFSC Code format (e.g. HDFC0001234)")
    private String bankIfsc;

    @Size(max = 100, message = "Bank name cannot exceed 100 characters")
    @Pattern(regexp = "^[a-zA-Z\\s\\.\\&\\-]{2,100}$", message = "Bank name contains invalid characters")
    private String bankName;

    @Size(max = 100, message = "Account holder name cannot exceed 100 characters")
    @Pattern(regexp = "^[a-zA-Z\\s\\.\\-]{2,100}$", message = "Account holder name contains invalid characters")
    private String accountHolderName;

    @Size(max = 100, message = "UPI ID cannot exceed 100 characters")
    @Pattern(regexp = "^[a-zA-Z0-9.\\-_]{2,256}@[a-zA-Z][a-zA-Z0-9]{2,64}$", message = "Invalid UPI ID format (e.g. name@okhdfcbank)")
    private String upiId;

    public UpdateBankDetailsRequest() {
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

    public String getAccountHolderName() {
        return accountHolderName;
    }

    public void setAccountHolderName(String accountHolderName) {
        this.accountHolderName = accountHolderName;
    }

    public String getUpiId() {
        return upiId;
    }

    public void setUpiId(String upiId) {
        this.upiId = upiId;
    }
}
