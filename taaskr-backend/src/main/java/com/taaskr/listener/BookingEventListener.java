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

    @Async
    @EventListener
    public void handleBookingCreated(BookingCreatedEvent event) {
        log.info("[EVENT DISPATCH] New Booking #{} created for service '{}' by customer #{} ({}). Matching eligible providers...",
                event.getBookingId(), event.getServiceName(), event.getCustomerId(), event.getCustomerEmail());
        // Real-world: Can push to WebSocket, Send SMS/Email, or trigger Kafka topic
    }

    @Async
    @EventListener
    public void handleBookingStatusChanged(BookingStatusChangedEvent event) {
        log.info("[EVENT DISPATCH] Booking #{} status transition: {} -> {} (Provider #{})",
                event.getBookingId(), event.getOldStatus(), event.getNewStatus(), event.getProviderId());
    }

    @Async
    @EventListener
    public void handlePaymentReceived(PaymentReceivedEvent event) {
        log.info("[EVENT DISPATCH] Payment of ₹{} confirmed for Booking #{} via {} (Ref: {})",
                event.getAmount(), event.getBookingId(), event.getPaymentMode(), event.getTransactionReference());
    }
}
