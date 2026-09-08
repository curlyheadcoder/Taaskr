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
    private final com.taaskr.service.NotificationService notificationService;
    private final com.taaskr.service.PayoutService payoutService;
    private final com.taaskr.repository.BookingRepository bookingRepository;

    public BookingEventListener(com.taaskr.service.AppMetricsService appMetricsService,
                                com.taaskr.service.NotificationService notificationService,
                                com.taaskr.service.PayoutService payoutService,
                                com.taaskr.repository.BookingRepository bookingRepository) {
        this.appMetricsService = appMetricsService;
        this.notificationService = notificationService;
        this.payoutService = payoutService;
        this.bookingRepository = bookingRepository;
    }

    @Async
    @EventListener
    public void handleBookingCreated(BookingCreatedEvent event) {
        log.info("[EVENT DISPATCH] New Booking #{} created for service '{}' by customer #{} ({}). Matching eligible providers...",
                event.getBookingId(), event.getServiceName(), event.getCustomerId(), event.getCustomerEmail());
        appMetricsService.recordBookingCreated("Service", event.getServiceName());

        bookingRepository.findById(event.getBookingId()).ifPresent(booking -> {
            if (booking.getUser() != null) {
                notificationService.sendNotification(
                        booking.getUser(),
                        "Booking Confirmed: #" + booking.getBookingCode(),
                        "Your request for " + event.getServiceName() + " has been booked for " + booking.getBookingDate() + " at " + booking.getStartTime(),
                        com.taaskr.enums.NotificationType.BOOKING_UPDATE,
                        "BOOKING",
                        booking.getId()
                );
            }
            if (booking.getProvider() != null && booking.getProvider().getUser() != null) {
                notificationService.sendNotification(
                        booking.getProvider().getUser(),
                        "New Task Assigned: #" + booking.getBookingCode(),
                        "You have been assigned to a task for " + event.getServiceName() + " in " + booking.getCity(),
                        com.taaskr.enums.NotificationType.BOOKING_UPDATE,
                        "BOOKING",
                        booking.getId()
                );
            }
        });
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

        bookingRepository.findById(event.getBookingId()).ifPresent(booking -> {
            if (booking.getUser() != null) {
                notificationService.sendNotification(
                        booking.getUser(),
                        "Booking Status Update: " + event.getNewStatus(),
                        "Your booking #" + booking.getBookingCode() + " status is now " + event.getNewStatus(),
                        com.taaskr.enums.NotificationType.BOOKING_UPDATE,
                        "BOOKING",
                        booking.getId()
                );
            }
            if (booking.getStatus() == com.taaskr.enums.BookingStatus.COMPLETED &&
                    booking.getPaymentStatus() == com.taaskr.enums.PaymentStatus.PAID) {
                payoutService.creditBookingEarnings(booking);
            }
        });
    }

    @Async
    @EventListener
    public void handlePaymentReceived(PaymentReceivedEvent event) {
        log.info("[EVENT DISPATCH] Payment of ₹{} confirmed for Booking #{} via {} (Ref: {})",
                event.getAmount(), event.getBookingId(), event.getPaymentMode(), event.getTransactionReference());
        appMetricsService.recordPayment("SUCCESS", event.getAmount() != null ? event.getAmount().doubleValue() : 0.0);

        bookingRepository.findById(event.getBookingId()).ifPresent(booking -> {
            if (booking.getUser() != null) {
                notificationService.sendNotification(
                        booking.getUser(),
                        "Payment Successful",
                        "Payment of ₹" + event.getAmount() + " received for booking #" + booking.getBookingCode(),
                        com.taaskr.enums.NotificationType.PAYMENT,
                        "BOOKING",
                        booking.getId()
                );
            }
            if (booking.getStatus() == com.taaskr.enums.BookingStatus.COMPLETED) {
                payoutService.creditBookingEarnings(booking);
            }
        });
    }
}
