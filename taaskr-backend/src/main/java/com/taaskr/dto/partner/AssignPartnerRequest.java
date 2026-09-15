package com.taaskr.dto.partner;

import jakarta.validation.constraints.NotNull;

public class AssignPartnerRequest {

    @NotNull(message = "Service Partner ID is required")
    private Long servicePartnerId;

    public AssignPartnerRequest() {}

    public AssignPartnerRequest(Long servicePartnerId) {
        this.servicePartnerId = servicePartnerId;
    }

    public Long getServicePartnerId() {
        return servicePartnerId;
    }

    public void setServicePartnerId(Long servicePartnerId) {
        this.servicePartnerId = servicePartnerId;
    }
}
