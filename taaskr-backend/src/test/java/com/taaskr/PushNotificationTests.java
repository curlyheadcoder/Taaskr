package com.taaskr;

import com.taaskr.entity.DevicePushToken;
import com.taaskr.entity.Notification;
import com.taaskr.entity.PushNotificationDelivery;
import com.taaskr.entity.User;
import com.taaskr.enums.NotificationType;
import com.taaskr.enums.PushDeliveryStatus;
import com.taaskr.enums.Role;
import com.taaskr.repository.DevicePushTokenRepository;
import com.taaskr.repository.NotificationRepository;
import com.taaskr.repository.PushNotificationDeliveryRepository;
import com.taaskr.repository.UserRepository;
import com.taaskr.service.NotificationService;
import com.taaskr.service.PushNotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class PushNotificationTests {

    @Autowired
    private PushNotificationService pushNotificationService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private DevicePushTokenRepository devicePushTokenRepository;

    @Autowired
    private PushNotificationDeliveryRepository pushNotificationDeliveryRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    private User testUser;
    private User testUser2;

    @BeforeEach
    public void setup() {
        testUser = userRepository.findByEmail("testpushuser@taaskr.com").orElseGet(() -> {
            User u = new User();
            u.setName("Test Push User");
            u.setEmail("testpushuser@taaskr.com");
            u.setPassword("Password@123");
            u.setPhone("9888877701");
            u.setRole(Role.USER);
            u.setEnabled(true);
            u.setEmailVerified(true);
            u.setPhoneVerified(true);
            return userRepository.save(u);
        });

        testUser2 = userRepository.findByEmail("testpushuser2@taaskr.com").orElseGet(() -> {
            User u = new User();
            u.setName("Test Push User 2");
            u.setEmail("testpushuser2@taaskr.com");
            u.setPassword("Password@123");
            u.setPhone("9888877702");
            u.setRole(Role.USER);
            u.setEnabled(true);
            u.setEmailVerified(true);
            u.setPhoneVerified(true);
            return userRepository.save(u);
        });
    }

    @Test
    public void testRegisterPushToken_Authenticated_Success() {
        String token = "ExponentPushToken[TestToken123456]";
        pushNotificationService.registerPushToken(testUser.getEmail(), token, "ANDROID", "EXPO");

        Optional<DevicePushToken> found = devicePushTokenRepository.findByToken(token);
        assertTrue(found.isPresent());
        assertEquals(testUser.getId(), found.get().getUser().getId());
        assertEquals("ANDROID", found.get().getPlatform());
        assertEquals("EXPO", found.get().getProvider());
        assertTrue(found.get().getActive());
    }

    @Test
    public void testRegisterPushToken_Idempotent_DoesNotDuplicate() {
        String token = "ExponentPushToken[IdempotentToken]";
        pushNotificationService.registerPushToken(testUser.getEmail(), token, "ANDROID", "EXPO");
        pushNotificationService.registerPushToken(testUser.getEmail(), token, "ANDROID", "EXPO");

        List<DevicePushToken> tokens = devicePushTokenRepository.findByUserId(testUser.getId());
        long matchCount = tokens.stream().filter(t -> t.getToken().equals(token)).count();
        assertEquals(1, matchCount);
    }

    @Test
    public void testMultiDeviceSupport() {
        String token1 = "ExponentPushToken[DevicePhone]";
        String token2 = "ExponentPushToken[DeviceTablet]";

        pushNotificationService.registerPushToken(testUser.getEmail(), token1, "ANDROID", "EXPO");
        pushNotificationService.registerPushToken(testUser.getEmail(), token2, "IOS", "EXPO");

        List<DevicePushToken> activeTokens = devicePushTokenRepository.findByUserIdAndActiveTrue(testUser.getId());
        assertTrue(activeTokens.size() >= 2);
    }

    @Test
    public void testTokenReassignedOnAccountSwitch() {
        String token = "ExponentPushToken[SharedDevice]";

        pushNotificationService.registerPushToken(testUser.getEmail(), token, "ANDROID", "EXPO");
        pushNotificationService.registerPushToken(testUser2.getEmail(), token, "ANDROID", "EXPO");

        Optional<DevicePushToken> found = devicePushTokenRepository.findByToken(token);
        assertTrue(found.isPresent());
        assertEquals(testUser2.getId(), found.get().getUser().getId());
    }

    @Test
    public void testUnregisterPushToken_LogoutDeactivatesToken() {
        String token = "ExponentPushToken[LogoutToken]";
        pushNotificationService.registerPushToken(testUser.getEmail(), token, "ANDROID", "EXPO");

        pushNotificationService.unregisterPushToken(testUser.getEmail(), token);

        Optional<DevicePushToken> found = devicePushTokenRepository.findByToken(token);
        assertTrue(found.isPresent());
        assertFalse(found.get().getActive());
    }

    @Test
    public void testDurablePushNotificationDeliveryCreated() {
        String token = "ExponentPushToken[DurableDeliveryToken]";
        pushNotificationService.registerPushToken(testUser.getEmail(), token, "ANDROID", "EXPO");

        Notification notif = new Notification(testUser, "Task Assigned", "Task #BK2002 assigned", NotificationType.BOOKING_UPDATE, "BOOKING", 2002L);
        Notification savedNotif = notificationRepository.save(notif);

        DevicePushToken pushTokenEntity = devicePushTokenRepository.findByToken(token).orElseThrow();
        PushNotificationDelivery delivery = new PushNotificationDelivery(savedNotif, pushTokenEntity);
        PushNotificationDelivery savedDelivery = pushNotificationDeliveryRepository.save(delivery);

        assertNotNull(savedDelivery.getId());
        assertEquals(PushDeliveryStatus.PENDING, savedDelivery.getStatus());
        assertEquals("EXPO", savedDelivery.getProvider());
    }

    @Test
    public void testPushDeliveryIdempotency_NoDuplicateDeliveryRows() {
        String token = "ExponentPushToken[IdempotentDeliveryToken]";
        pushNotificationService.registerPushToken(testUser.getEmail(), token, "ANDROID", "EXPO");

        Notification notif = new Notification(testUser, "Test Idempotency", "Body", NotificationType.INFO, "BOOKING", 3003L);
        Notification savedNotif = notificationRepository.save(notif);
        DevicePushToken pushTokenEntity = devicePushTokenRepository.findByToken(token).orElseThrow();

        PushNotificationDelivery d1 = new PushNotificationDelivery(savedNotif, pushTokenEntity);
        pushNotificationDeliveryRepository.save(d1);

        Optional<PushNotificationDelivery> existing = pushNotificationDeliveryRepository
                .findByNotificationIdAndDevicePushTokenId(savedNotif.getId(), pushTokenEntity.getId());
        assertTrue(existing.isPresent());

        List<PushNotificationDelivery> deliveries = pushNotificationDeliveryRepository.findByNotificationId(savedNotif.getId());
        assertEquals(1, deliveries.size());
    }

    @Test
    public void testRetryWorker_ProcessesRetryableDeliveries() {
        String token = "ExponentPushToken[RetryWorkerToken]";
        pushNotificationService.registerPushToken(testUser.getEmail(), token, "ANDROID", "EXPO");

        Notification notif = new Notification(testUser, "Test Retry", "Body", NotificationType.INFO, "BOOKING", 4004L);
        Notification savedNotif = notificationRepository.save(notif);
        DevicePushToken pushTokenEntity = devicePushTokenRepository.findByToken(token).orElseThrow();

        PushNotificationDelivery delivery = new PushNotificationDelivery(savedNotif, pushTokenEntity);
        delivery.setStatus(PushDeliveryStatus.FAILED_RETRYABLE);
        delivery.setNextAttemptAt(java.time.LocalDateTime.now().minusMinutes(1));
        pushNotificationDeliveryRepository.save(delivery);

        assertDoesNotThrow(() -> pushNotificationService.retryFailedDeliveries());
    }

    @Test
    public void testProcessPushReceipts_ExecutesCleanly() {
        String token = "ExponentPushToken[ReceiptWorkerToken]";
        pushNotificationService.registerPushToken(testUser.getEmail(), token, "ANDROID", "EXPO");

        Notification notif = new Notification(testUser, "Test Receipt", "Body", NotificationType.INFO, "BOOKING", 5005L);
        Notification savedNotif = notificationRepository.save(notif);
        DevicePushToken pushTokenEntity = devicePushTokenRepository.findByToken(token).orElseThrow();

        PushNotificationDelivery delivery = new PushNotificationDelivery(savedNotif, pushTokenEntity);
        delivery.setStatus(PushDeliveryStatus.SENT_ACCEPTED);
        delivery.setProviderTicketId("ticket-test-1234");
        delivery.setNextAttemptAt(java.time.LocalDateTime.now().minusMinutes(1));
        pushNotificationDeliveryRepository.save(delivery);

        assertDoesNotThrow(() -> pushNotificationService.processPushReceipts());
    }
}
