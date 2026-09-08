package com.taaskr.dto.payout;

import com.taaskr.enums.PayoutStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class ProcessPayoutRequest {

    @NotNull(message = "Payout status is required")
    private PayoutStatus status;

    @Size(max = 100, message = "Transaction reference must not exceed 100 characters")
    private String transactionReference;

    @Size(max = 500, message = "Admin notes must not exceed 500 characters")
    private String adminNotes;

    public ProcessPayoutRequest() {
    }

    public PayoutStatus getStatus() {
        return status;
    }

    public void setStatus(PayoutStatus status) {
        this.status = status;
    }

    public String getTransactionReference() {
        return transactionReference;
    }

    public void setTransactionReference(String transactionReference) {
        this.transactionReference = transactionReference;
    }

    public String getAdminNotes() {
        return adminNotes;
    }

    public void setAdminNotes(String adminNotes) {
        this.adminNotes = adminNotes;
    }
}
