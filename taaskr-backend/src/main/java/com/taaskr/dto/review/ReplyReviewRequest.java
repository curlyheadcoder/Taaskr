package com.taaskr.dto.review;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ReplyReviewRequest {

    @NotBlank(message = "Reply message cannot be empty")
    @Size(max = 1000, message = "Reply must not exceed 1000 characters")
    private String reply;

    public ReplyReviewRequest() {
    }

    public String getReply() {
        return reply;
    }

    public void setReply(String reply) {
        this.reply = reply;
    }
}
