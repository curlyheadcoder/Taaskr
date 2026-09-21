package com.taaskr.config;

import com.taaskr.service.PushNotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

@Configuration
@EnableScheduling
public class PushNotificationRetryScheduler {

    private static final Logger log = LoggerFactory.getLogger(PushNotificationRetryScheduler.class);
    private final PushNotificationService pushNotificationService;

    public PushNotificationRetryScheduler(PushNotificationService pushNotificationService) {
        this.pushNotificationService = pushNotificationService;
    }

    @Scheduled(fixedDelay = 30000, initialDelay = 15000)
    public void processPushRetries() {
        try {
            pushNotificationService.retryFailedDeliveries();
        } catch (Exception e) {
            log.error("[PUSH RETRY SCHEDULER ERROR] Error running scheduled push retries: {}", e.getMessage());
        }
    }

    @Scheduled(fixedDelay = 30000, initialDelay = 25000)
    public void processPushReceipts() {
        try {
            pushNotificationService.processPushReceipts();
        } catch (Exception e) {
            log.error("[PUSH RECEIPT SCHEDULER ERROR] Error running scheduled push receipts processing: {}", e.getMessage());
        }
    }
}
