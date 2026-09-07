package com.taaskr.dto.admin;

import jakarta.validation.constraints.NotNull;

public class UpdateProviderRemarksRequest {

    @NotNull(message = "Remarks cannot be null")
    private String remarks;

    public UpdateProviderRemarksRequest() {
    }

    public UpdateProviderRemarksRequest(String remarks) {
        this.remarks = remarks;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }
}
