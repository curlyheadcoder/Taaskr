package com.taaskr.security;

import com.taaskr.service.TrackingService;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Principal;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class WebSocketChannelInterceptor implements ChannelInterceptor {

    private static final Pattern BOOKING_LOCATION_TOPIC_PATTERN = Pattern.compile("^/topic/bookings/(\\d+)/location$");

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;
    private final TrackingService trackingService;

    public WebSocketChannelInterceptor(JwtService jwtService,
                                      CustomUserDetailsService userDetailsService,
                                      @org.springframework.context.annotation.Lazy TrackingService trackingService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        this.trackingService = trackingService;
    }


    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            return message;
        }

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String token = extractToken(accessor);
            if (token == null || token.trim().isEmpty() || "null".equalsIgnoreCase(token) || "undefined".equalsIgnoreCase(token)) {
                throw new AccessDeniedException("Authentication required for WebSocket connection");
            }

            try {
                String email = jwtService.extractUsername(token);
                if (email != null) {
                    UserDetails userDetails = userDetailsService.loadUserByUsername(email);
                    if (jwtService.isTokenValid(token, userDetails)) {
                        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities()
                        );
                        if (accessor.isMutable()) {
                            accessor.setUser(auth);
                            return message;
                        } else {
                            StompHeaderAccessor mutableAccessor = StompHeaderAccessor.wrap(message);
                            mutableAccessor.setUser(auth);
                            return org.springframework.messaging.support.MessageBuilder.createMessage(
                                    (byte[]) message.getPayload(),
                                    mutableAccessor.getMessageHeaders()
                            );
                        }
                    } else {

                        throw new AccessDeniedException("Invalid JWT token for WebSocket connection");
                    }
                } else {
                    throw new AccessDeniedException("Invalid JWT token for WebSocket connection");
                }
            } catch (AccessDeniedException e) {
                throw e;
            } catch (Exception e) {
                throw new AccessDeniedException("Authentication failed for WebSocket connection", e);
            }

        } else if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            Principal principal = accessor.getUser();
            if (principal == null || principal.getName() == null) {
                throw new AccessDeniedException("Access denied");
            }

            String destination = accessor.getDestination();
            if (destination != null) {
                Matcher matcher = BOOKING_LOCATION_TOPIC_PATTERN.matcher(destination);
                if (matcher.matches()) {
                    Long bookingId;
                    try {
                        bookingId = Long.parseLong(matcher.group(1));
                    } catch (NumberFormatException e) {
                        throw new AccessDeniedException("Access denied");
                    }

                    boolean authorized = trackingService.isAuthorizedForBooking(principal.getName(), bookingId);
                    if (!authorized) {
                        throw new AccessDeniedException("Access denied");
                    }
                } else if (destination.startsWith("/topic/") || destination.startsWith("/queue/")) {
                    if (principal == null) {
                        throw new AccessDeniedException("Access denied");
                    }
                }
            }
        }

        return message;
    }

    private String extractToken(StompHeaderAccessor accessor) {
        String authHeader = accessor.getFirstNativeHeader("Authorization");
        if (authHeader == null) {
            authHeader = accessor.getFirstNativeHeader("authorization");
        }
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        if (authHeader != null && !authHeader.trim().isEmpty()) {
            return authHeader.trim();
        }

        String tokenHeader = accessor.getFirstNativeHeader("token");
        if (tokenHeader == null) {
            tokenHeader = accessor.getFirstNativeHeader("access_token");
        }
        if (tokenHeader == null) {
            tokenHeader = accessor.getFirstNativeHeader("passcode");
        }
        if (tokenHeader != null && !tokenHeader.trim().isEmpty()) {
            return tokenHeader.trim();
        }

        Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
        if (sessionAttributes != null && sessionAttributes.containsKey("token")) {
            Object tokObj = sessionAttributes.get("token");
            if (tokObj != null) {
                return tokObj.toString();
            }
        }

        return null;
    }
}
