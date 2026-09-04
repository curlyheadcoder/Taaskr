package com.taaskr.dto.ai;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public class AiChatRequest {

    @NotBlank(message = "Message cannot be blank")
    private String message;

    private List<ChatMessage> history;

    private String city;

    private String pincode;

    private Long selectedServiceId;

    public AiChatRequest() {}

    public AiChatRequest(String message) {
        this.message = message;
    }

    public static class ChatMessage {
        private String role; // "user" or "assistant"
        private String content;

        public ChatMessage() {}

        public ChatMessage(String role, String content) {
            this.role = role;
            this.content = content;
        }

        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }

        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
    }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public List<ChatMessage> getHistory() { return history; }
    public void setHistory(List<ChatMessage> history) { this.history = history; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getPincode() { return pincode; }
    public void setPincode(String pincode) { this.pincode = pincode; }

    public Long getSelectedServiceId() { return selectedServiceId; }
    public void setSelectedServiceId(Long selectedServiceId) { this.selectedServiceId = selectedServiceId; }
}
