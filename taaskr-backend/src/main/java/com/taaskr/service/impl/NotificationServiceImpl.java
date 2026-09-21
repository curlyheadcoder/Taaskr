package com.taaskr.service.impl;

import com.taaskr.dto.notification.NotificationResponse;
import com.taaskr.entity.Notification;
import com.taaskr.entity.User;
import com.taaskr.enums.NotificationType;
import com.taaskr.repository.NotificationRepository;
import com.taaskr.repository.UserRepository;
import com.taaskr.service.NotificationService;
import com.taaskr.service.PushNotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final PushNotificationService pushNotificationService;

    public NotificationServiceImpl(NotificationRepository notificationRepository,
                                   UserRepository userRepository,
                                   PushNotificationService pushNotificationService) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.pushNotificationService = pushNotificationService;
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getMyNotifications(String userEmail) {
        User user = getUserByEmail(userEmail);
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(NotificationResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public com.taaskr.dto.common.PageResponse<NotificationResponse> getMyNotifications(String userEmail, org.springframework.data.domain.Pageable pageable) {
        User user = getUserByEmail(userEmail);
        org.springframework.data.domain.Page<Notification> page = notificationRepository.findByUserId(user.getId(), pageable);
        return com.taaskr.dto.common.PageResponse.of(page, NotificationResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getUnreadCount(String userEmail) {
        User user = getUserByEmail(userEmail);
        long count = notificationRepository.countByUserIdAndIsReadFalse(user.getId());
        return Map.of("unreadCount", count);
    }

    @Override
    public NotificationResponse markAsRead(Long id, String userEmail) {
        User user = getUserByEmail(userEmail);
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));

        if (!notification.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to notification");
        }

        notification.setIsRead(true);
        Notification saved = notificationRepository.save(notification);
        return NotificationResponse.fromEntity(saved);
    }

    @Override
    public void markAllAsRead(String userEmail) {
        User user = getUserByEmail(userEmail);
        notificationRepository.markAllAsReadForUser(user.getId());
    }

    @Override
    public void sendNotification(User user, String title, String message, NotificationType type, String refType, Long refId) {
        if (user == null) return;
        Notification notification = new Notification(user, title, message, type, refType, refId);
        notificationRepository.save(notification);

        Map<String, Object> dataPayload = new HashMap<>();
        if (type != null) dataPayload.put("type", type.name());
        if (refType != null) dataPayload.put("refType", refType);
        if (refId != null) {
            dataPayload.put("refId", refId);
            dataPayload.put("bookingId", refId);
        }
        dataPayload.put("notificationId", notification.getId());

        pushNotificationService.sendPushNotification(user, notification, dataPayload);
    }

    @Override
    public void sendNotificationByUserId(Long userId, String title, String message, NotificationType type, String refType, Long refId) {
        if (userId == null) return;
        userRepository.findById(userId).ifPresent(user -> {
            sendNotification(user, title, message, type, refType, refId);
        });
    }
}
