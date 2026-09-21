package com.taaskr.repository;

import com.taaskr.entity.PushNotificationDelivery;
import com.taaskr.enums.PushDeliveryStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PushNotificationDeliveryRepository extends JpaRepository<PushNotificationDelivery, Long> {

    Optional<PushNotificationDelivery> findByNotificationIdAndDevicePushTokenId(Long notificationId, Long devicePushTokenId);

    List<PushNotificationDelivery> findByStatusAndNextAttemptAtLessThanEqual(
            PushDeliveryStatus status,
            LocalDateTime now,
            Pageable pageable
    );

    List<PushNotificationDelivery> findByStatusAndProviderTicketIdIsNotNullAndNextAttemptAtLessThanEqual(
            PushDeliveryStatus status,
            LocalDateTime now,
            Pageable pageable
    );

    List<PushNotificationDelivery> findByStatusAndCreatedAtLessThanEqual(
            PushDeliveryStatus status,
            LocalDateTime threshold,
            Pageable pageable
    );

    List<PushNotificationDelivery> findByNotificationId(Long notificationId);
}
