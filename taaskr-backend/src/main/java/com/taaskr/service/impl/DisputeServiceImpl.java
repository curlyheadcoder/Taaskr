package com.taaskr.service.impl;

import com.taaskr.dto.dispute.CreateDisputeRequest;
import com.taaskr.dto.dispute.DisputeResponse;
import com.taaskr.dto.dispute.ResolveDisputeRequest;
import com.taaskr.entity.*;
import com.taaskr.enums.DisputeStatus;
import com.taaskr.enums.NotificationType;
import com.taaskr.repository.*;
import com.taaskr.service.DisputeService;
import com.taaskr.service.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class DisputeServiceImpl implements DisputeService {

    private final DisputeRepository disputeRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final NotificationService notificationService;

    public DisputeServiceImpl(DisputeRepository disputeRepository,
                              BookingRepository bookingRepository,
                              UserRepository userRepository,
                              ProviderProfileRepository providerProfileRepository,
                              NotificationService notificationService) {
        this.disputeRepository = disputeRepository;
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.providerProfileRepository = providerProfileRepository;
        this.notificationService = notificationService;
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    @Override
    public DisputeResponse createDispute(CreateDisputeRequest request, String userEmail) {
        User user = getUserByEmail(userEmail);

        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));

        if (!booking.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only dispute your own bookings");
        }

        if (disputeRepository.findByBookingId(booking.getId()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A dispute has already been filed for this booking");
        }

        Dispute dispute = new Dispute();
        dispute.setBooking(booking);
        dispute.setUser(user);
        dispute.setProvider(booking.getProvider());
        dispute.setReason(request.getReason());
        dispute.setDescription(request.getDescription());
        dispute.setStatus(DisputeStatus.OPEN);

        Dispute saved = disputeRepository.save(dispute);

        // Notify customer
        notificationService.sendNotification(
                user,
                "Dispute Case Filed #" + saved.getId(),
                "Your dispute for booking #" + booking.getBookingCode() + " has been registered. An admin will review it shortly.",
                NotificationType.ALERT,
                "DISPUTE",
                saved.getId()
        );

        // Notify provider if assigned
        if (booking.getProvider() != null && booking.getProvider().getUser() != null) {
            notificationService.sendNotification(
                    booking.getProvider().getUser(),
                    "Dispute Raised on Booking #" + booking.getBookingCode(),
                    "A customer raised a dispute: " + request.getReason(),
                    NotificationType.ALERT,
                    "DISPUTE",
                    saved.getId()
            );
        }

        return DisputeResponse.fromEntity(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DisputeResponse> getMyDisputes(String userEmail) {
        User user = getUserByEmail(userEmail);
        return disputeRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(DisputeResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<DisputeResponse> getProviderDisputes(String providerEmail) {
        User user = getUserByEmail(providerEmail);
        ProviderProfile provider = providerProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Provider profile not found"));
        return disputeRepository.findByProviderIdOrderByCreatedAtDesc(provider.getId())
                .stream()
                .map(DisputeResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<DisputeResponse> getAllDisputesForAdmin() {
        return disputeRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(DisputeResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public DisputeResponse getDisputeById(Long id) {
        Dispute dispute = disputeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Dispute not found"));
        return DisputeResponse.fromEntity(dispute);
    }

    @Override
    public DisputeResponse resolveDispute(Long id, ResolveDisputeRequest request, String adminEmail) {
        Dispute dispute = disputeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Dispute not found"));

        dispute.setStatus(request.getStatus());
        dispute.setResolution(request.getResolution());
        dispute.setRefundAmount(request.getRefundAmount());
        dispute.setResolvedBy(adminEmail);

        Dispute saved = disputeRepository.save(dispute);

        // Notify customer
        if (dispute.getUser() != null) {
            notificationService.sendNotification(
                    dispute.getUser(),
                    "Dispute #" + dispute.getId() + " Resolved: " + dispute.getStatus(),
                    "Admin resolution: " + (dispute.getResolution() != null ? dispute.getResolution() : dispute.getStatus().name()),
                    NotificationType.INFO,
                    "DISPUTE",
                    dispute.getId()
            );
        }

        // Notify provider
        if (dispute.getProvider() != null && dispute.getProvider().getUser() != null) {
            notificationService.sendNotification(
                    dispute.getProvider().getUser(),
                    "Dispute #" + dispute.getId() + " Resolved: " + dispute.getStatus(),
                    "Admin resolution: " + (dispute.getResolution() != null ? dispute.getResolution() : dispute.getStatus().name()),
                    NotificationType.INFO,
                    "DISPUTE",
                    dispute.getId()
            );
        }

        return DisputeResponse.fromEntity(saved);
    }
}
