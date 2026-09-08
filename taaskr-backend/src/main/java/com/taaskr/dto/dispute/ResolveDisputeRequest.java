package com.taaskr.dto.dispute;

import com.taaskr.enums.DisputeStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public class ResolveDisputeRequest {

    @NotNull(message = "Status is required")
    private DisputeStatus status;

    @Size(max = 2000, message = "Resolution cannot exceed 2000 characters")
    private String resolution;

    private BigDecimal refundAmount;

    public ResolveDisputeRequest() {
    }

    public DisputeStatus getStatus() {
        return status;
    }

    public void setStatus(DisputeStatus status) {
        this.status = status;
    }

    public String getResolution() {
        return resolution;
    }

    public void setResolution(String resolution) {
        this.resolution = resolution;
    }

    public BigDecimal getRefundAmount() {
        return refundAmount;
    }

    public void setRefundAmount(BigDecimal refundAmount) {
        this.refundAmount = refundAmount;
    }
}
