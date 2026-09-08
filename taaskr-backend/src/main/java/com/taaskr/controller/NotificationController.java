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

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
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
}
