package com.taaskr.dto.discussion;

import com.taaskr.enums.DiscussionCategory;
import com.taaskr.enums.DiscussionPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreateDiscussionRequest {

    @NotBlank(message = "Subject is required")
    @Size(max = 180, message = "Subject cannot exceed 180 characters")
    private String subject;

    private DiscussionCategory category = DiscussionCategory.GENERAL_INQUIRY;

    private DiscussionPriority priority = DiscussionPriority.NORMAL;

    private Long bookingId;

    @NotBlank(message = "Initial message is required")
    @Size(max = 2000, message = "Message cannot exceed 2000 characters")
    private String message;

    public CreateDiscussionRequest() {
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public DiscussionCategory getCategory() {
        return category;
    }

    public void setCategory(DiscussionCategory category) {
        this.category = category;
    }

    public DiscussionPriority getPriority() {
        return priority;
    }

    public void setPriority(DiscussionPriority priority) {
        this.priority = priority;
    }

    public Long getBookingId() {
        return bookingId;
    }

    public void setBookingId(Long bookingId) {
        this.bookingId = bookingId;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
