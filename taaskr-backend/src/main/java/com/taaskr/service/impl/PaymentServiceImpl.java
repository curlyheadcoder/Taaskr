package com.taaskr.service.impl;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import com.taaskr.config.RazorpayConfig.RazorpayProperties;
import com.taaskr.dto.payment.CreatePaymentOrderRequest;
import com.taaskr.dto.payment.PaymentOrderResponse;
import com.taaskr.dto.payment.VerifyPaymentRequest;
import com.taaskr.entity.Booking;
import com.taaskr.entity.Payment;
import com.taaskr.entity.User;
import com.taaskr.enums.PaymentStatus;
import com.taaskr.enums.PaymentMethod;
import com.taaskr.exception.BadRequestException;
import com.taaskr.exception.ResourceNotFoundException;
import com.taaskr.repository.BookingRepository;
import com.taaskr.repository.PaymentRepository;
import com.taaskr.repository.UserRepository;
import com.taaskr.service.PaymentService;
import org.json.JSONObject;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final RazorpayProperties razorpayProperties;

    public PaymentServiceImpl(
            PaymentRepository paymentRepository,
            BookingRepository bookingRepository,
            UserRepository userRepository,
            RazorpayProperties razorpayProperties) {

        this.paymentRepository = paymentRepository;
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.razorpayProperties = razorpayProperties;
    }

    @Transactional
    @Override
    public PaymentOrderResponse createPaymentOrder(
            String userEmail,
            CreatePaymentOrderRequest request) {

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found"));

        Booking booking = bookingRepository
                .findByIdAndUserId(request.getBookingId(), user.getId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Booking not found"
                        ));

        if (booking.getFinalAmount() == null
                || booking.getFinalAmount().compareTo(BigDecimal.ZERO) <= 0) {

            throw new BadRequestException(
                    "Booking amount must be greater than zero"
            );
        }

        if (booking.getPaymentStatus() == PaymentStatus.PAID) {
            throw new BadRequestException(
                    "Booking is already paid"
            );
        }

        if (booking.getPaymentMethod() == PaymentMethod.AFTER_SERVICE) {
            throw new BadRequestException(
                    "This booking is payable to the provider after the service is completed"
            );
        }

        Payment existingPayment = paymentRepository
                .findByBookingId(booking.getId())
                .orElse(null);

        if (existingPayment != null
                && existingPayment.getStatus() == PaymentStatus.PAID) {

            throw new BadRequestException(
                    "Booking is already paid"
            );
        }

        /*
         * Use the amount stored in the booking.
         * Never trust an amount supplied by the frontend.
         */
        BigDecimal amount = booking.getFinalAmount()
                .setScale(2, RoundingMode.HALF_UP);

        long amountInPaise = amount
                .movePointRight(2)
                .longValueExact();

        try {
            RazorpayClient razorpayClient = new RazorpayClient(
                    razorpayProperties.keyId(),
                    razorpayProperties.keySecret()
            );

            JSONObject orderRequest = new JSONObject();

            orderRequest.put("amount", amountInPaise);
            orderRequest.put("currency", "INR");
            orderRequest.put(
                    "receipt",
                    booking.getBookingCode()
            );

            JSONObject notes = new JSONObject();
            notes.put(
                    "booking_id",
                    booking.getId().toString()
            );
            notes.put(
                    "user_id",
                    user.getId().toString()
            );

            orderRequest.put("notes", notes);

            Order razorpayOrder =
                    razorpayClient.orders.create(orderRequest);

            String razorpayOrderId =
                    razorpayOrder.get("id");

            Payment payment;

            if (existingPayment == null) {

                payment = new Payment();

                payment.setBooking(booking);
                payment.setUser(user);
                payment.setAmount(amount);
                payment.setCurrency("INR");
                payment.setStatus(PaymentStatus.PENDING);

            } else {

                payment = existingPayment;

                payment.setAmount(amount);
                payment.setCurrency("INR");
                payment.setStatus(PaymentStatus.PENDING);
            }

            payment.setRazorpayOrderId(razorpayOrderId);
            payment.setRazorpayPaymentId(null);
            payment.setRazorpaySignature(null);

            Payment savedPayment =
                    paymentRepository.save(payment);

            return new PaymentOrderResponse(
                    savedPayment.getId(),
                    booking.getId(),
                    razorpayOrderId,
                    amount,
                    "INR",
                    razorpayProperties.keyId()
            );

        } catch (RazorpayException ex) {

            throw new BadRequestException(
                    "Unable to create Razorpay order: "
                            + ex.getMessage()
            );
        }
    }

    @Transactional
    @Override
    public PaymentOrderResponse verifyPayment(
            String userEmail,
            VerifyPaymentRequest request) {

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found"));

        /*
         * Find the payment using the Razorpay order ID stored
         * in our database.
         *
         * We deliberately do NOT trust the order ID sent by the
         * browser as the source of truth.
         */
        Payment payment = paymentRepository
                .findByRazorpayOrderId(request.getRazorpayOrderId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Payment order not found"
                        ));

        /*
         * Verify that this payment belongs to the authenticated user.
         */
        if (!payment.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException(
                    "Payment not found"
            );
        }

        /*
         * Idempotency:
         *
         * If the same successful payment is verified again,
         * don't process it again.
         */
        if (payment.getStatus() == PaymentStatus.PAID) {

            return new PaymentOrderResponse(
                    payment.getId(),
                    payment.getBooking().getId(),
                    payment.getRazorpayOrderId(),
                    payment.getAmount(),
                    payment.getCurrency(),
                    razorpayProperties.keyId()
            );
        }

        /*
         * Verify that the order ID supplied by the client
         * corresponds to the order stored in our database.
         */
        if (!payment.getRazorpayOrderId()
                .equals(request.getRazorpayOrderId())) {

            throw new BadRequestException(
                    "Invalid Razorpay order ID"
            );
        }

        try {

            JSONObject verificationData = new JSONObject();

            /*
             * IMPORTANT:
             *
             * Use the order ID stored in our database,
             * not the browser-provided order ID.
             */
            verificationData.put(
                    "razorpay_order_id",
                    payment.getRazorpayOrderId()
            );

            verificationData.put(
                    "razorpay_payment_id",
                    request.getRazorpayPaymentId()
            );

            verificationData.put(
                    "razorpay_signature",
                    request.getRazorpaySignature()
            );

            boolean signatureValid =
                    Utils.verifyPaymentSignature(
                            verificationData,
                            razorpayProperties.keySecret()
                    );

            if (!signatureValid) {

                payment.setStatus(PaymentStatus.FAILED);
                paymentRepository.save(payment);

                throw new BadRequestException(
                        "Payment signature verification failed"
                );
            }

            /*
             * Signature is valid.
             *
             * Store the Razorpay payment information.
             */
            payment.setRazorpayPaymentId(
                    request.getRazorpayPaymentId()
            );

            payment.setRazorpaySignature(
                    request.getRazorpaySignature()
            );

            payment.setStatus(PaymentStatus.PAID);

            Payment savedPayment =
                    paymentRepository.save(payment);

            /*
             * Keep Booking.paymentStatus synchronized
             * with Payment.status.
             */
            Booking booking = payment.getBooking();

            booking.setPaymentStatus(PaymentStatus.PAID);

            bookingRepository.save(booking);

            return new PaymentOrderResponse(
                    savedPayment.getId(),
                    booking.getId(),
                    savedPayment.getRazorpayOrderId(),
                    savedPayment.getAmount(),
                    savedPayment.getCurrency(),
                    razorpayProperties.keyId()
            );

        } catch (RazorpayException ex) {

            throw new BadRequestException(
                    "Unable to verify Razorpay payment: "
                            + ex.getMessage()
            );
        }
    }
}
