package com.taaskr.service;

import com.taaskr.dto.common.PageResponse;
import com.taaskr.dto.notification.NotificationResponse;
import com.taaskr.entity.User;
import com.taaskr.enums.NotificationType;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;

public interface NotificationService {
    List<NotificationResponse> getMyNotifications(String userEmail);
    PageResponse<NotificationResponse> getMyNotifications(String userEmail, Pageable pageable);
    Map<String, Object> getUnreadCount(String userEmail);
    NotificationResponse markAsRead(Long id, String userEmail);
    void markAllAsRead(String userEmail);

    void sendNotification(User user, String title, String message, NotificationType type, String refType, Long refId);
    void sendNotificationByUserId(Long userId, String title, String message, NotificationType type, String refType, Long refId);
}
