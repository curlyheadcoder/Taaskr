package com.taaskr.controller;

import com.taaskr.dto.notification.NotificationResponse;
import com.taaskr.service.NotificationService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@PreAuthorize("isAuthenticated()")
public class NotificationController {

    private final NotificationService notificationService;
    private final com.taaskr.service.PushNotificationService pushNotificationService;

    public NotificationController(NotificationService notificationService,
                                  com.taaskr.service.PushNotificationService pushNotificationService) {
        this.notificationService = notificationService;
        this.pushNotificationService = pushNotificationService;
    }

    @GetMapping
    public List<NotificationResponse> getMyNotifications(Authentication authentication) {
        return notificationService.getMyNotifications(authentication.getName());
    }

    @GetMapping("/page")
    public com.taaskr.dto.common.PageResponse<NotificationResponse> getMyNotificationsPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));
        return notificationService.getMyNotifications(authentication.getName(), pageable);
    }

    @GetMapping("/unread-count")
    public Map<String, Object> getUnreadCount(Authentication authentication) {
        return notificationService.getUnreadCount(authentication.getName());
    }

    @PatchMapping("/{id}/read")
    public NotificationResponse markAsRead(@PathVariable Long id, Authentication authentication) {
        return notificationService.markAsRead(id, authentication.getName());
    }

    @PutMapping("/{id}/read")
    public NotificationResponse markAsReadPut(@PathVariable Long id, Authentication authentication) {
        return notificationService.markAsRead(id, authentication.getName());
    }

    @PostMapping("/read-all")
    public Map<String, Object> markAllAsRead(Authentication authentication) {
        notificationService.markAllAsRead(authentication.getName());
        return Map.of("success", true, "message", "All notifications marked as read");
    }

    @PutMapping("/read-all")
    public Map<String, Object> markAllAsReadPut(Authentication authentication) {
        notificationService.markAllAsRead(authentication.getName());
        return Map.of("success", true, "message", "All notifications marked as read");
    }

    @PostMapping("/push-token")
    public Map<String, Object> registerPushToken(@jakarta.validation.Valid @RequestBody com.taaskr.dto.notification.PushTokenRequest request,
                                                Authentication authentication) {
        pushNotificationService.registerPushToken(
                authentication.getName(),
                request.getToken(),
                request.getPlatform(),
                request.getProvider()
        );
        return Map.of("success", true, "message", "Push token registered successfully");
    }

    @DeleteMapping("/push-token")
    public Map<String, Object> unregisterPushToken(@RequestParam String token, Authentication authentication) {
        pushNotificationService.unregisterPushToken(authentication.getName(), token);
        return Map.of("success", true, "message", "Push token unregistered successfully");
    }

    @PostMapping("/push-token/unregister")
    public Map<String, Object> unregisterPushTokenPost(@RequestBody com.taaskr.dto.notification.PushTokenRequest request, Authentication authentication) {
        pushNotificationService.unregisterPushToken(authentication.getName(), request.getToken());
        return Map.of("success", true, "message", "Push token unregistered successfully");
    }
}
