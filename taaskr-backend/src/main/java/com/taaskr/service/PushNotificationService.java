package com.taaskr.service;

import com.taaskr.entity.Notification;
import com.taaskr.entity.User;
import java.util.Map;

public interface PushNotificationService {

    void registerPushToken(String userEmail, String token, String platform, String provider);

    void unregisterPushToken(String userEmail, String token);

    void sendPushNotification(User user, Notification notification, Map<String, Object> data);

    void retryFailedDeliveries();

    void processPushReceipts();
}
