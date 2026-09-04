package com.taaskr.dto.ai;

import com.taaskr.dto.booking.BookingResponse;
import com.taaskr.dto.service.ServiceResponse;

import java.util.List;

public class AiChatResponse {

    private String reply;

    private String intent; // "SEARCH", "DETAILS", "AVAILABILITY", "MY_BOOKINGS", "CONFIRMATION", "UNSUPPORTED", "GENERAL"

    private String urgency; // "LOW", "MEDIUM", "HIGH", "EMERGENCY"

    private String safetyNotice;

    private List<ServiceResponse> services;

    private List<BookingResponse> bookings;

    private List<String> quickReplies;

    private String actionType; // "BOOK_SERVICE", "VIEW_BOOKINGS", "SELECT_LOCATION", "NAVIGATE", "NONE"

    private Long targetServiceId;

    public AiChatResponse() {}

    public AiChatResponse(String reply) {
        this.reply = reply;
        this.intent = "GENERAL";
        this.actionType = "NONE";
    }

    public static AiChatResponse ofMessage(String reply) {
        AiChatResponse res = new AiChatResponse(reply);
        return res;
    }

    public String getReply() { return reply; }
    public void setReply(String reply) { this.reply = reply; }

    public String getMessage() { return reply; }
    public void setMessage(String message) { this.reply = message; }

    public String getIntent() { return intent; }
    public void setIntent(String intent) { this.intent = intent; }

    public String getUrgency() { return urgency; }
    public void setUrgency(String urgency) { this.urgency = urgency; }

    public String getSafetyNotice() { return safetyNotice; }
    public void setSafetyNotice(String safetyNotice) { this.safetyNotice = safetyNotice; }

    public List<ServiceResponse> getServices() { return services; }
    public void setServices(List<ServiceResponse> services) { this.services = services; }

    public List<ServiceResponse> getRecommendedServices() { return services; }
    public void setRecommendedServices(List<ServiceResponse> services) { this.services = services; }

    public List<BookingResponse> getBookings() { return bookings; }
    public void setBookings(List<BookingResponse> bookings) { this.bookings = bookings; }

    public List<BookingResponse> getUserBookings() { return bookings; }
    public void setUserBookings(List<BookingResponse> bookings) { this.bookings = bookings; }

    public List<String> getQuickReplies() { return quickReplies; }
    public void setQuickReplies(List<String> quickReplies) { this.quickReplies = quickReplies; }

    public List<String> getSuggestedPrompts() { return quickReplies; }
    public void setSuggestedPrompts(List<String> suggestedPrompts) { this.quickReplies = suggestedPrompts; }

    public String getActionType() { return actionType; }
    public void setActionType(String actionType) { this.actionType = actionType; }

    public Long getTargetServiceId() { return targetServiceId; }
    public void setTargetServiceId(Long targetServiceId) { this.targetServiceId = targetServiceId; }
}

