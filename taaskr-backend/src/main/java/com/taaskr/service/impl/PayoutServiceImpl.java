package com.taaskr.service.impl;

import com.taaskr.dto.payout.PayoutResponse;
import com.taaskr.dto.payout.ProcessPayoutRequest;
import com.taaskr.dto.payout.RequestPayoutRequest;
import com.taaskr.dto.payout.WalletOverviewResponse;
import com.taaskr.entity.*;
import com.taaskr.enums.NotificationType;
import com.taaskr.enums.PayoutStatus;
import com.taaskr.enums.WalletTransactionType;
import com.taaskr.repository.*;
import com.taaskr.service.NotificationService;
import com.taaskr.service.PayoutService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class PayoutServiceImpl implements PayoutService {

    private final PayoutRepository payoutRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final NotificationService notificationService;

    public PayoutServiceImpl(PayoutRepository payoutRepository,
                             WalletTransactionRepository walletTransactionRepository,
                             ProviderProfileRepository providerProfileRepository,
                             UserRepository userRepository,
                             BookingRepository bookingRepository,
                             NotificationService notificationService) {
        this.payoutRepository = payoutRepository;
        this.walletTransactionRepository = walletTransactionRepository;
        this.providerProfileRepository = providerProfileRepository;
        this.userRepository = userRepository;
        this.bookingRepository = bookingRepository;
        this.notificationService = notificationService;
    }

    private ProviderProfile getProviderByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return providerProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Provider profile not found"));
    }

    private BigDecimal getCurrentBalance(Long providerId) {
        List<WalletTransaction> txns = walletTransactionRepository.findByProviderIdOrderByCreatedAtDesc(providerId);
        if (txns.isEmpty()) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return txns.get(0).getBalanceAfter().setScale(2, RoundingMode.HALF_UP);
    }

    private PayoutResponse mapToPayoutResponse(Payout payout) {
        PayoutResponse res = new PayoutResponse();
        res.setId(payout.getId());
        if (payout.getProvider() != null) {
            res.setProviderId(payout.getProvider().getId());
            res.setProviderName(payout.getProvider().getUser() != null ? payout.getProvider().getUser().getFullName() : "Provider");
        }
        res.setAmount(payout.getAmount());
        res.setStatus(payout.getStatus());
        res.setBankAccountNumber(payout.getBankAccountNumber());
        res.setBankIfsc(payout.getBankIfsc());
        res.setBankName(payout.getBankName());
        res.setUpiId(payout.getUpiId());
        res.setAdminNotes(payout.getAdminNotes());
        res.setTransactionReference(payout.getTransactionReference());
        res.setRequestedAt(payout.getRequestedAt());
        res.setProcessedAt(payout.getProcessedAt());
        return res;
    }

    @Override
    @Transactional
    public WalletOverviewResponse getWalletOverview(String providerEmail) {
        ProviderProfile provider = getProviderByEmail(providerEmail);

        // Auto-reconcile completed bookings that have not yet been credited to the wallet
        List<Booking> providerBookings = bookingRepository.findByProviderIdOrderByCreatedAtDesc(provider.getId());
        for (Booking b : providerBookings) {
            if (b.getStatus() == com.taaskr.enums.BookingStatus.COMPLETED &&
                    (b.getPaymentStatus() == com.taaskr.enums.PaymentStatus.PAID || b.getPaymentMethod() == com.taaskr.enums.PaymentMethod.AFTER_SERVICE) &&
                    !walletTransactionRepository.existsByBookingIdAndType(b.getId(), WalletTransactionType.EARNING)) {
                creditBookingEarnings(b);
            }
        }

        List<WalletTransaction> txns = walletTransactionRepository.findByProviderIdOrderByCreatedAtDesc(provider.getId());
        List<Payout> payouts = payoutRepository.findByProviderIdOrderByRequestedAtDesc(provider.getId());

        BigDecimal currentBalance = txns.isEmpty() ? BigDecimal.ZERO : txns.get(0).getBalanceAfter();

        BigDecimal lifetimeEarnings = txns.stream()
                .filter(t -> t.getType() == WalletTransactionType.EARNING)
                .map(WalletTransaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalPlatformFees = txns.stream()
                .filter(t -> t.getType() == WalletTransactionType.COMMISSION)
                .map(WalletTransaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalWithdrawn = payouts.stream()
                .filter(p -> p.getStatus() == PayoutStatus.PROCESSED || p.getStatus() == PayoutStatus.COMPLETED)
                .map(Payout::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal pendingPayouts = payouts.stream()
                .filter(p -> p.getStatus() == PayoutStatus.REQUESTED || p.getStatus() == PayoutStatus.APPROVED || p.getStatus() == PayoutStatus.PROCESSING)
                .map(Payout::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<WalletOverviewResponse.TransactionItem> recentTxns = txns.stream()
                .limit(20)
                .map(t -> new WalletOverviewResponse.TransactionItem(
                        t.getId(),
                        t.getBooking() != null ? t.getBooking().getId() : null,
                        t.getBooking() != null ? t.getBooking().getBookingCode() : null,
                        t.getType(),
                        t.getAmount(),
                        t.getBalanceAfter(),
                        t.getDescription(),
                        t.getCreatedAt()
                ))
                .collect(Collectors.toList());

        List<PayoutResponse> recentPayoutResponses = payouts.stream()
                .limit(20)
                .map(this::mapToPayoutResponse)
                .collect(Collectors.toList());

        return new WalletOverviewResponse(
                currentBalance.setScale(2, RoundingMode.HALF_UP),
                lifetimeEarnings.setScale(2, RoundingMode.HALF_UP),
                totalPlatformFees.setScale(2, RoundingMode.HALF_UP),
                totalWithdrawn.setScale(2, RoundingMode.HALF_UP),
                pendingPayouts.setScale(2, RoundingMode.HALF_UP),
                recentTxns,
                recentPayoutResponses
        );
    }

    @Override
    public PayoutResponse requestPayout(RequestPayoutRequest request, String providerEmail) {
        ProviderProfile provider = getProviderByEmail(providerEmail);

        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.valueOf(100)) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Minimum payout request amount is ₹100.00");
        }

        BigDecimal balance = getCurrentBalance(provider.getId());
        if (balance.compareTo(request.getAmount()) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Insufficient wallet balance for this withdrawal");
        }

        boolean hasUpi = request.getUpiId() != null && !request.getUpiId().isBlank();
        boolean hasBank = request.getBankAccountNumber() != null && !request.getBankAccountNumber().isBlank();

        if (!hasUpi && !hasBank) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Either Bank Account details or UPI ID must be provided");
        }

        if (hasUpi) {
            String upi = request.getUpiId().trim();
            if (!upi.matches("^[a-zA-Z0-9.\\-_]{2,256}@[a-zA-Z][a-zA-Z0-9]{2,64}$")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid UPI ID format. Example: name@okhdfcbank or 9876543210@paytm");
            }
        }

        if (hasBank) {
            String acc = request.getBankAccountNumber().trim();
            if (!acc.matches("^[0-9]{9,18}$")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bank account number must be between 9 and 18 numeric digits");
            }
            if (request.getBankIfsc() == null || request.getBankIfsc().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "IFSC Code is required for bank transfer");
            }
            String ifsc = request.getBankIfsc().trim().toUpperCase();
            if (!ifsc.matches("^[A-Z]{4}0[A-Z0-9]{6}$")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid IFSC Code format. Must be 11 characters (e.g. HDFC0001234)");
            }
            if (request.getBankName() != null && !request.getBankName().isBlank()) {
                String name = request.getBankName().trim();
                if (!name.matches("^[a-zA-Z\\s\\.\\&\\-]{2,100}$")) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bank name contains invalid characters");
                }
            }
        }

        Payout payout = new Payout();
        payout.setProvider(provider);
        payout.setAmount(request.getAmount());
        payout.setStatus(PayoutStatus.REQUESTED);
        payout.setBankAccountNumber(hasBank ? request.getBankAccountNumber().trim() : null);
        payout.setBankIfsc(hasBank ? request.getBankIfsc().trim().toUpperCase() : null);
        payout.setBankName(hasBank && request.getBankName() != null ? request.getBankName().trim() : null);
        payout.setUpiId(hasUpi ? request.getUpiId().trim() : null);

        if (request.getNotes() != null && !request.getNotes().isBlank()) {
            payout.setAdminNotes(request.getNotes().trim());
            if (payout.getUpiId() == null && request.getNotes().contains("@")) {
                payout.setUpiId(request.getNotes().trim());
            }
        }

        Payout savedPayout = payoutRepository.save(payout);

        // Deduct from wallet immediately
        BigDecimal newBalance = balance.subtract(request.getAmount()).setScale(2, RoundingMode.HALF_UP);
        WalletTransaction txn = new WalletTransaction(
                provider,
                null,
                WalletTransactionType.PAYOUT_WITHDRAWAL,
                request.getAmount().negate(),
                newBalance,
                "Payout withdrawal request #" + savedPayout.getId()
        );
        walletTransactionRepository.save(txn);

        if (provider.getUser() != null) {
            notificationService.sendNotification(
                    provider.getUser(),
                    "Payout Request Submitted",
                    "Your withdrawal request of ₹" + request.getAmount() + " has been submitted and is awaiting approval.",
                    NotificationType.PAYMENT,
                    "PAYOUT",
                    savedPayout.getId()
            );
        }

        return mapToPayoutResponse(savedPayout);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PayoutResponse> getMyPayouts(String providerEmail) {
        ProviderProfile provider = getProviderByEmail(providerEmail);
        return payoutRepository.findByProviderIdOrderByRequestedAtDesc(provider.getId())
                .stream()
                .map(this::mapToPayoutResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PayoutResponse> getAllPayoutsForAdmin() {
        return payoutRepository.findAllByOrderByRequestedAtDesc()
                .stream()
                .map(this::mapToPayoutResponse)
                .collect(Collectors.toList());
    }

    @Override
    public PayoutResponse processPayout(Long payoutId, ProcessPayoutRequest request, String adminEmail) {
        Payout payout = payoutRepository.findById(payoutId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payout request not found"));

        if (payout.getStatus() == PayoutStatus.PROCESSED || payout.getStatus() == PayoutStatus.COMPLETED || payout.getStatus() == PayoutStatus.REJECTED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payout is already finalized as " + payout.getStatus());
        }

        payout.setStatus(request.getStatus());
        payout.setAdminNotes(request.getAdminNotes());
        payout.setTransactionReference(request.getTransactionReference());
        payout.setProcessedAt(LocalDateTime.now());

        // If rejected, refund the balance back to provider's wallet
        if (request.getStatus() == PayoutStatus.REJECTED) {
            BigDecimal currentBal = getCurrentBalance(payout.getProvider().getId());
            BigDecimal restoredBal = currentBal.add(payout.getAmount()).setScale(2, RoundingMode.HALF_UP);
            WalletTransaction refundTxn = new WalletTransaction(
                    payout.getProvider(),
                    null,
                    WalletTransactionType.ADJUSTMENT,
                    payout.getAmount(),
                    restoredBal,
                    "Refund for rejected payout request #" + payout.getId() + ": " + (request.getAdminNotes() != null ? request.getAdminNotes() : "")
            );
            walletTransactionRepository.save(refundTxn);
        }

        Payout saved = payoutRepository.save(payout);

        if (payout.getProvider() != null && payout.getProvider().getUser() != null) {
            String message = (request.getStatus() == PayoutStatus.PROCESSED || request.getStatus() == PayoutStatus.COMPLETED)
                    ? "Your payout of ₹" + payout.getAmount() + " has been processed! Ref: " + (request.getTransactionReference() != null ? request.getTransactionReference() : "N/A")
                    : "Your payout request #" + payout.getId() + " was updated to " + request.getStatus();
            notificationService.sendNotification(
                    payout.getProvider().getUser(),
                    "Payout Update: " + request.getStatus(),
                    message,
                    NotificationType.PAYMENT,
                    "PAYOUT",
                    payout.getId()
            );
        }

        return mapToPayoutResponse(saved);
    }

    @Override
    public void creditBookingEarnings(Booking booking) {
        if (booking == null || booking.getProvider() == null || booking.getFinalAmount() == null) {
            return;
        }

        // Avoid double credit
        if (walletTransactionRepository.existsByBookingIdAndType(booking.getId(), WalletTransactionType.EARNING)) {
            return;
        }

        BigDecimal gross = booking.getFinalAmount();
        BigDecimal commission = gross.multiply(BigDecimal.valueOf(0.15)).setScale(2, RoundingMode.HALF_UP);
        BigDecimal netEarnings = gross.subtract(commission).setScale(2, RoundingMode.HALF_UP);

        BigDecimal currentBal = getCurrentBalance(booking.getProvider().getId());
        BigDecimal newBal = currentBal.add(netEarnings).setScale(2, RoundingMode.HALF_UP);

        WalletTransaction earningTxn = new WalletTransaction(
                booking.getProvider(),
                booking,
                WalletTransactionType.EARNING,
                netEarnings,
                newBal,
                "Net earnings from completed booking #" + booking.getBookingCode() + " (Gross: ₹" + gross + ", Fee: ₹" + commission + ")"
        );
        walletTransactionRepository.save(earningTxn);

        WalletTransaction feeTxn = new WalletTransaction(
                booking.getProvider(),
                booking,
                WalletTransactionType.COMMISSION,
                commission,
                newBal,
                "15% Platform fee on booking #" + booking.getBookingCode()
        );
        walletTransactionRepository.save(feeTxn);
    }
}
