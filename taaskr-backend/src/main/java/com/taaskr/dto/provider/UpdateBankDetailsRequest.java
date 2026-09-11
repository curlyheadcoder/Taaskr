package com.taaskr.dto.provider;

import jakarta.validation.constraints.Size;

public class UpdateBankDetailsRequest {

    @Size(max = 50, message = "Bank account number cannot exceed 50 characters")
    private String bankAccountNumber;

    @Size(max = 20, message = "Bank IFSC cannot exceed 20 characters")
    private String bankIfsc;

    @Size(max = 100, message = "Bank name cannot exceed 100 characters")
    private String bankName;

    @Size(max = 100, message = "Account holder name cannot exceed 100 characters")
    private String accountHolderName;

    @Size(max = 100, message = "UPI ID cannot exceed 100 characters")
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
