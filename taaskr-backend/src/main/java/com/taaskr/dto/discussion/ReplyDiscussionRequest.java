package com.taaskr.dto.discussion;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ReplyDiscussionRequest {

    @NotBlank(message = "Reply message cannot be blank")
    @Size(max = 2000, message = "Reply cannot exceed 2000 characters")
    private String message;

    public ReplyDiscussionRequest() {
    }

    public ReplyDiscussionRequest(String message) {
        this.message = message;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
