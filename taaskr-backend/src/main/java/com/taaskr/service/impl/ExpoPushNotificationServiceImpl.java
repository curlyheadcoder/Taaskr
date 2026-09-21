package com.taaskr.service.impl;

import com.taaskr.entity.DevicePushToken;
import com.taaskr.entity.Notification;
import com.taaskr.entity.PushNotificationDelivery;
import com.taaskr.entity.User;
import com.taaskr.enums.PushDeliveryStatus;
import com.taaskr.exception.ResourceNotFoundException;
import com.taaskr.repository.DevicePushTokenRepository;
import com.taaskr.repository.PushNotificationDeliveryRepository;
import com.taaskr.repository.UserRepository;
import com.taaskr.service.PushNotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ExpoPushNotificationServiceImpl implements PushNotificationService {

    private static final Logger log = LoggerFactory.getLogger(ExpoPushNotificationServiceImpl.class);
    private static final String EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
    private static final String EXPO_RECEIPTS_URL = "https://exp.host/--/api/v2/push/getReceipts";

    private final DevicePushTokenRepository tokenRepository;
    private final PushNotificationDeliveryRepository deliveryRepository;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate;

    @Value("${taaskr.push.enabled:true}")
    private boolean pushEnabled;

    @Value("${taaskr.push.expo-access-token:}")
    private String expoAccessToken;

    public ExpoPushNotificationServiceImpl(DevicePushTokenRepository tokenRepository,
                                            PushNotificationDeliveryRepository deliveryRepository,
                                            UserRepository userRepository) {
        this.tokenRepository = tokenRepository;
        this.deliveryRepository = deliveryRepository;
        this.userRepository = userRepository;
        this.restTemplate = new RestTemplate();
    }

    @Override
    @Transactional
    public void registerPushToken(String userEmail, String token, String platform, String provider) {
        if (token == null || token.trim().isEmpty()) {
            return;
        }

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String cleanToken = token.trim();
        Optional<DevicePushToken> existingOpt = tokenRepository.findByToken(cleanToken);

        if (existingOpt.isPresent()) {
            DevicePushToken existing = existingOpt.get();
            existing.setUser(user);
            existing.setPlatform(platform != null ? platform : "ANDROID");
            existing.setProvider(provider != null ? provider : "EXPO");
            existing.setActive(true);
            existing.setLastSeenAt(LocalDateTime.now());
            tokenRepository.save(existing);
            log.info("[PUSH REGISTRATION] Updated push token for User #{} ({})", user.getId(), user.getEmail());
        } else {
            DevicePushToken newToken = new DevicePushToken(user, cleanToken, platform, provider);
            tokenRepository.save(newToken);
            log.info("[PUSH REGISTRATION] Registered new push token for User #{} ({})", user.getId(), user.getEmail());
        }
    }

    @Override
    @Transactional
    public void unregisterPushToken(String userEmail, String token) {
        if (token == null || token.trim().isEmpty()) {
            return;
        }

        userRepository.findByEmail(userEmail).ifPresent(user -> {
            tokenRepository.deactivateTokenForUser(user.getId(), token.trim());
            log.info("[PUSH UNREGISTRATION] Deactivated push token for User #{} ({})", user.getId(), user.getEmail());
        });
    }

    @Override
    @Async("taskExecutor")
    @Transactional
    public void sendPushNotification(User user, Notification notification, Map<String, Object> data) {
        if (user == null || user.getId() == null || notification == null || notification.getId() == null) {
            return;
        }

        if (!pushEnabled) {
            log.info("[PUSH DISABLED] Push delivery skipped for User #{} ('{}')", user.getId(), notification.getTitle());
            return;
        }

        List<DevicePushToken> tokens = tokenRepository.findByUserIdAndActiveTrue(user.getId());
        if (tokens.isEmpty()) {
            log.debug("[PUSH] No active push tokens registered for User #{}", user.getId());
            return;
        }

        for (DevicePushToken tokenEntity : tokens) {
            PushNotificationDelivery delivery = deliveryRepository
                    .findByNotificationIdAndDevicePushTokenId(notification.getId(), tokenEntity.getId())
                    .orElseGet(() -> {
                        PushNotificationDelivery newDelivery = new PushNotificationDelivery(notification, tokenEntity);
                        try {
                            return deliveryRepository.save(newDelivery);
                        } catch (Exception e) {
                            return deliveryRepository.findByNotificationIdAndDevicePushTokenId(notification.getId(), tokenEntity.getId())
                                    .orElse(newDelivery);
                        }
                    });

            if (delivery.getStatus() == PushDeliveryStatus.PENDING || delivery.getStatus() == PushDeliveryStatus.FAILED_RETRYABLE) {
                dispatchDelivery(delivery, notification, data);
            }
        }
    }

    @Override
    @Transactional
    public void retryFailedDeliveries() {
        if (!pushEnabled) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        List<PushNotificationDelivery> retryable = deliveryRepository.findByStatusAndNextAttemptAtLessThanEqual(
                PushDeliveryStatus.FAILED_RETRYABLE,
                now,
                PageRequest.of(0, 50)
        );

        if (retryable.isEmpty()) {
            return;
        }

        log.info("[PUSH RETRY WORKER] Found {} retryable push delivery tasks", retryable.size());
        for (PushNotificationDelivery delivery : retryable) {
            if (delivery.getDevicePushToken() != null && Boolean.TRUE.equals(delivery.getDevicePushToken().getActive())) {
                Map<String, Object> dataPayload = new HashMap<>();
                if (delivery.getNotification().getType() != null) {
                    dataPayload.put("type", delivery.getNotification().getType().name());
                }
                if (delivery.getNotification().getReferenceType() != null) {
                    dataPayload.put("refType", delivery.getNotification().getReferenceType());
                }
                if (delivery.getNotification().getReferenceId() != null) {
                    dataPayload.put("refId", delivery.getNotification().getReferenceId());
                    dataPayload.put("bookingId", delivery.getNotification().getReferenceId());
                }
                dataPayload.put("notificationId", delivery.getNotification().getId());

                dispatchDelivery(delivery, delivery.getNotification(), dataPayload);
            } else {
                delivery.setStatus(PushDeliveryStatus.INVALID_TOKEN);
                delivery.setFailureReason("Token inactive or revoked");
                deliveryRepository.save(delivery);
            }
        }
    }

    @Override
    @Transactional
    public void processPushReceipts() {
        if (!pushEnabled) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        // 1. Process active SENT_ACCEPTED tickets due for receipt check
        List<PushNotificationDelivery> pendingReceipts = deliveryRepository
                .findByStatusAndProviderTicketIdIsNotNullAndNextAttemptAtLessThanEqual(
                        PushDeliveryStatus.SENT_ACCEPTED,
                        now,
                        PageRequest.of(0, 100)
                );

        if (!pendingReceipts.isEmpty()) {
            log.info("[PUSH RECEIPT WORKER] Polling receipts for {} accepted push tickets", pendingReceipts.size());
            pollReceiptBatch(pendingReceipts);
        }

        // 2. Handle stale SENT_ACCEPTED deliveries older than 24 hours whose receipts expired
        LocalDateTime staleThreshold = now.minusHours(24);
        List<PushNotificationDelivery> staleDeliveries = deliveryRepository
                .findByStatusAndCreatedAtLessThanEqual(
                        PushDeliveryStatus.SENT_ACCEPTED,
                        staleThreshold,
                        PageRequest.of(0, 50)
                );

        for (PushNotificationDelivery stale : staleDeliveries) {
            log.warn("[PUSH RECEIPT STALE] Delivery #{} ticket '{}' expired (24h limit). Marking FAILED_PERMANENT",
                    stale.getId(), stale.getProviderTicketId());
            stale.setStatus(PushDeliveryStatus.FAILED_PERMANENT);
            stale.setFailureReason("Receipt polling expired (24h limit reached)");
            stale.setNextAttemptAt(null);
            deliveryRepository.save(stale);
        }
    }

    private void pollReceiptBatch(List<PushNotificationDelivery> deliveries) {
        Map<String, PushNotificationDelivery> ticketMap = new HashMap<>();
        for (PushNotificationDelivery d : deliveries) {
            if (d.getProviderTicketId() != null && !d.getProviderTicketId().trim().isEmpty()) {
                ticketMap.put(d.getProviderTicketId().trim(), d);
            }
        }

        if (ticketMap.isEmpty()) {
            return;
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
            if (expoAccessToken != null && !expoAccessToken.trim().isEmpty()) {
                headers.setBearerAuth(expoAccessToken.trim());
            }

            Map<String, Object> body = Map.of("ids", new ArrayList<>(ticketMap.keySet()));
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(EXPO_RECEIPTS_URL, request, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map responseBody = response.getBody();
                if (responseBody.containsKey("data") && responseBody.get("data") instanceof Map dataMap) {
                    for (Map.Entry<String, PushNotificationDelivery> entry : ticketMap.entrySet()) {
                        String ticketId = entry.getKey();
                        PushNotificationDelivery delivery = entry.getValue();

                        if (dataMap.containsKey(ticketId) && dataMap.get(ticketId) instanceof Map receipt) {
                            handleSingleReceipt(delivery, receipt);
                        } else {
                            // Receipt not ready yet; reschedule next check in 60 seconds
                            delivery.setNextAttemptAt(LocalDateTime.now().plusSeconds(60));
                            deliveryRepository.save(delivery);
                        }
                    }
                }
            } else {
                log.warn("[PUSH RECEIPT WARN] Receipts API returned HTTP {}", response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("[PUSH RECEIPT ERROR] Failed to fetch push receipts: {}", e.getMessage());
        }
    }

    private void handleSingleReceipt(PushNotificationDelivery delivery, Map receipt) {
        String status = (String) receipt.get("status");
        if ("ok".equalsIgnoreCase(status)) {
            log.info("[PUSH RECEIPT DELIVERED] Delivery #{} ticket '{}' verified DELIVERED by Expo gateway",
                    delivery.getId(), delivery.getProviderTicketId());
            delivery.setStatus(PushDeliveryStatus.DELIVERED);
            delivery.setFailureReason(null);
            delivery.setNextAttemptAt(null);
            deliveryRepository.save(delivery);
        } else if ("error".equalsIgnoreCase(status)) {
            String detailsError = receipt.containsKey("details") && receipt.get("details") instanceof Map d
                    ? (String) d.get("error") : null;
            if (detailsError == null) {
                detailsError = (String) receipt.get("message");
            }

            log.warn("[PUSH RECEIPT ERROR] Delivery #{} ticket '{}' reported error: {}",
                    delivery.getId(), delivery.getProviderTicketId(), detailsError);

            if ("DeviceNotRegistered".equalsIgnoreCase(detailsError)) {
                DevicePushToken tokenEntity = delivery.getDevicePushToken();
                if (tokenEntity != null) {
                    tokenEntity.setActive(false);
                    tokenRepository.save(tokenEntity);
                }
                delivery.setStatus(PushDeliveryStatus.INVALID_TOKEN);
                delivery.setFailureReason("DeviceNotRegistered");
                delivery.setNextAttemptAt(null);
            } else if ("MessageRateExceeded".equalsIgnoreCase(detailsError)) {
                delivery.setStatus(PushDeliveryStatus.FAILED_RETRYABLE);
                delivery.setFailureReason("MessageRateExceeded");
                delivery.setNextAttemptAt(LocalDateTime.now().plusMinutes(5));
            } else {
                delivery.setStatus(PushDeliveryStatus.FAILED_PERMANENT);
                delivery.setFailureReason(detailsError != null ? detailsError : "Receipt Error");
                delivery.setNextAttemptAt(null);
            }
            deliveryRepository.save(delivery);
        }
    }

    private void dispatchDelivery(PushNotificationDelivery delivery, Notification notification, Map<String, Object> data) {
        DevicePushToken tokenEntity = delivery.getDevicePushToken();
        if (tokenEntity == null || !Boolean.TRUE.equals(tokenEntity.getActive())) {
            delivery.setStatus(PushDeliveryStatus.INVALID_TOKEN);
            delivery.setFailureReason("Token inactive or revoked");
            deliveryRepository.save(delivery);
            return;
        }

        delivery.setStatus(PushDeliveryStatus.SENDING);
        delivery.setLastAttemptAt(LocalDateTime.now());
        delivery.setAttemptCount(delivery.getAttemptCount() + 1);
        deliveryRepository.save(delivery);

        String maskedToken = tokenEntity.getToken().length() > 8
                ? "..." + tokenEntity.getToken().substring(tokenEntity.getToken().length() - 8)
                : tokenEntity.getToken();

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
            headers.set("Accept-Encoding", "gzip, deflate");

            if (expoAccessToken != null && !expoAccessToken.trim().isEmpty()) {
                headers.setBearerAuth(expoAccessToken.trim());
            }

            Map<String, Object> payload = new HashMap<>();
            payload.put("to", tokenEntity.getToken());
            payload.put("title", notification.getTitle());
            payload.put("body", notification.getMessage());
            payload.put("sound", "default");
            payload.put("channelId", "taaskr_default");
            payload.put("priority", "high");

            if (data != null && !data.isEmpty()) {
                payload.put("data", data);
            }

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(EXPO_PUSH_URL, request, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map responseBody = response.getBody();
                handleExpoResponse(delivery, tokenEntity, responseBody, maskedToken);
            } else {
                handleDeliveryFailure(delivery, "HTTP " + response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("[PUSH DISPATCH ERROR] Failure delivering push to User #{} (Token {}): {}",
                    tokenEntity.getUser().getId(), maskedToken, e.getMessage());
            handleDeliveryFailure(delivery, e.getMessage());
        }
    }

    private void handleExpoResponse(PushNotificationDelivery delivery, DevicePushToken tokenEntity, Map responseBody, String maskedToken) {
        boolean ticketError = false;
        String ticketErrorType = null;
        String ticketId = null;

        if (responseBody.containsKey("data")) {
            Object dataObj = responseBody.get("data");
            Map ticketMap = null;

            if (dataObj instanceof List list && !list.isEmpty() && list.get(0) instanceof Map m) {
                ticketMap = m;
            } else if (dataObj instanceof Map m) {
                ticketMap = m;
            }

            if (ticketMap != null) {
                if ("ok".equalsIgnoreCase((String) ticketMap.get("status"))) {
                    ticketId = (String) ticketMap.get("id");
                } else if ("error".equalsIgnoreCase((String) ticketMap.get("status"))) {
                    ticketError = true;
                    if (ticketMap.containsKey("details") && ticketMap.get("details") instanceof Map d) {
                        ticketErrorType = (String) d.get("error");
                    }
                    if (ticketErrorType == null) {
                        ticketErrorType = (String) ticketMap.get("message");
                    }
                }
            }
        }

        if (ticketError) {
            if ("DeviceNotRegistered".equalsIgnoreCase(ticketErrorType)) {
                log.warn("[PUSH TOKEN INVALID] Deactivating invalid push token for User #{} (Token: {})",
                        tokenEntity.getUser().getId(), maskedToken);
                tokenEntity.setActive(false);
                tokenRepository.save(tokenEntity);

                delivery.setStatus(PushDeliveryStatus.INVALID_TOKEN);
                delivery.setFailureReason("DeviceNotRegistered");
                deliveryRepository.save(delivery);
            } else {
                handleDeliveryFailure(delivery, ticketErrorType != null ? ticketErrorType : "Expo Ticket Error");
            }
        } else {
            delivery.setStatus(PushDeliveryStatus.SENT_ACCEPTED);
            delivery.setProviderTicketId(ticketId);
            delivery.setFailureReason(null);
            // Schedule initial receipt check in 15 seconds
            delivery.setNextAttemptAt(LocalDateTime.now().plusSeconds(15));
            deliveryRepository.save(delivery);
            log.info("[PUSH DISPATCH ACCEPTED] Provider accepted ticket '{}' for User #{} (Token {}). Scheduled receipt check.",
                    ticketId != null ? ticketId : "ACK", tokenEntity.getUser().getId(), maskedToken);
        }
    }

    private void handleDeliveryFailure(PushNotificationDelivery delivery, String reason) {
        delivery.setFailureReason(reason != null && reason.length() > 500 ? reason.substring(0, 500) : reason);

        if (delivery.getAttemptCount() >= delivery.getMaxAttempts()) {
            delivery.setStatus(PushDeliveryStatus.FAILED_PERMANENT);
            delivery.setNextAttemptAt(null);
            log.warn("[PUSH DISPATCH FAILED PERMANENT] Delivery #{} reached max attempts ({}). Reason: {}",
                    delivery.getId(), delivery.getMaxAttempts(), reason);
        } else {
            delivery.setStatus(PushDeliveryStatus.FAILED_RETRYABLE);
            int delaySeconds = (int) (30 * Math.pow(2, delivery.getAttemptCount() - 1));
            delivery.setNextAttemptAt(LocalDateTime.now().plusSeconds(delaySeconds));
            log.info("[PUSH DISPATCH RETRYABLE] Delivery #{} scheduled for retry in {} seconds (Attempt {}/{})",
                    delivery.getId(), delaySeconds, delivery.getAttemptCount(), delivery.getMaxAttempts());
        }
        deliveryRepository.save(delivery);
    }
}
