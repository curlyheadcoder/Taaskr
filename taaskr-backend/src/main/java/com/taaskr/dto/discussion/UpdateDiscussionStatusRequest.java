package com.taaskr.dto.discussion;

import com.taaskr.enums.DiscussionStatus;
import jakarta.validation.constraints.NotNull;

public class UpdateDiscussionStatusRequest {

    @NotNull(message = "Status is required")
    private DiscussionStatus status;

    public UpdateDiscussionStatusRequest() {
    }

    public UpdateDiscussionStatusRequest(DiscussionStatus status) {
        this.status = status;
    }

    public DiscussionStatus getStatus() {
        return status;
    }

    public void setStatus(DiscussionStatus status) {
        this.status = status;
    }
}
