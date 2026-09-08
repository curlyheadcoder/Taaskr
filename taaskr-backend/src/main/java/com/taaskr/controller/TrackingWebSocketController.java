package com.taaskr.controller;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;
import java.util.Map;

@Controller
public class TrackingWebSocketController {

    @MessageMapping("/track/{bookingId}")
    @SendTo("/topic/bookings/{bookingId}/location")
    public Map<String, Object> broadcastLocation(@DestinationVariable Long bookingId, Map<String, Object> payload) {
        payload.put("timestamp", LocalDateTime.now().toString());
        payload.put("bookingId", bookingId);
        return payload;
    }
}
