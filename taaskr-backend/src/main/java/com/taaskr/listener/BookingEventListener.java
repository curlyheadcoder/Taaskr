package com.taaskr.listener;

import com.taaskr.event.BookingCreatedEvent;
import com.taaskr.event.BookingStatusChangedEvent;
import com.taaskr.event.PaymentReceivedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
public class BookingEventListener {

    private static final Logger log = LoggerFactory.getLogger(BookingEventListener.class);
    private final com.taaskr.service.AppMetricsService appMetricsService;

    public BookingEventListener(com.taaskr.service.AppMetricsService appMetricsService) {
        this.appMetricsService = appMetricsService;
    }

    @Async
    @EventListener
    public void handleBookingCreated(BookingCreatedEvent event) {
        log.info("[EVENT DISPATCH] New Booking #{} created for service '{}' by customer #{} ({}). Matching eligible providers...",
                event.getBookingId(), event.getServiceName(), event.getCustomerId(), event.getCustomerEmail());
        appMetricsService.recordBookingCreated("Service", event.getServiceName());
    }

    @Async
    @EventListener
    public void handleBookingStatusChanged(BookingStatusChangedEvent event) {
        log.info("[EVENT DISPATCH] Booking #{} status transition: {} -> {} (Provider #{})",
                event.getBookingId(), event.getOldStatus(), event.getNewStatus(), event.getProviderId());
        appMetricsService.recordBookingStatusChanged(
                event.getOldStatus() != null ? event.getOldStatus().name() : null,
                event.getNewStatus() != null ? event.getNewStatus().name() : null
        );
    }

    @Async
    @EventListener
    public void handlePaymentReceived(PaymentReceivedEvent event) {
        log.info("[EVENT DISPATCH] Payment of ₹{} confirmed for Booking #{} via {} (Ref: {})",
                event.getAmount(), event.getBookingId(), event.getPaymentMode(), event.getTransactionReference());
        appMetricsService.recordPayment("SUCCESS", event.getAmount() != null ? event.getAmount().doubleValue() : 0.0);
    }
}
