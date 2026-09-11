package com.taaskr.dto.provider;

public class ProviderBankDetailsResponse {

    private String bankAccountNumber;
    private String bankIfsc;
    private String bankName;
    private String accountHolderName;
    private String upiId;

    public ProviderBankDetailsResponse() {
    }

    public ProviderBankDetailsResponse(String bankAccountNumber, String bankIfsc, String bankName, String accountHolderName, String upiId) {
        this.bankAccountNumber = bankAccountNumber;
        this.bankIfsc = bankIfsc;
        this.bankName = bankName;
        this.accountHolderName = accountHolderName;
        this.upiId = upiId;
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
