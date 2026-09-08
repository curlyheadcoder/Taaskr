package com.taaskr.dto.kyc;

import com.taaskr.enums.KycDocumentStatus;
import jakarta.validation.constraints.NotNull;

public class VerifyKycRequest {

    @NotNull(message = "Status is required")
    private KycDocumentStatus status;

    private String rejectionReason;

    public VerifyKycRequest() {
    }

    public VerifyKycRequest(KycDocumentStatus status, String rejectionReason) {
        this.status = status;
        this.rejectionReason = rejectionReason;
    }

    public KycDocumentStatus getStatus() {
        return status;
    }

    public void setStatus(KycDocumentStatus status) {
        this.status = status;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }
}
