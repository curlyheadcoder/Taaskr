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
    private final NotificationService notificationService;

    public PayoutServiceImpl(PayoutRepository payoutRepository,
                             WalletTransactionRepository walletTransactionRepository,
                             ProviderProfileRepository providerProfileRepository,
                             UserRepository userRepository,
                             NotificationService notificationService) {
        this.payoutRepository = payoutRepository;
        this.walletTransactionRepository = walletTransactionRepository;
        this.providerProfileRepository = providerProfileRepository;
        this.userRepository = userRepository;
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
    @Transactional(readOnly = true)
    public WalletOverviewResponse getWalletOverview(String providerEmail) {
        ProviderProfile provider = getProviderByEmail(providerEmail);
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
                .filter(p -> p.getStatus() == PayoutStatus.PROCESSED)
                .map(Payout::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal pendingPayouts = payouts.stream()
                .filter(p -> p.getStatus() == PayoutStatus.REQUESTED || p.getStatus() == PayoutStatus.APPROVED)
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
                .limit(10)
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

        Payout payout = new Payout();
        payout.setProvider(provider);
        payout.setAmount(request.getAmount());
        payout.setStatus(PayoutStatus.REQUESTED);
        payout.setBankAccountNumber(request.getBankAccountNumber());
        payout.setBankIfsc(request.getBankIfsc());
        payout.setBankName(request.getBankName());
        payout.setUpiId(request.getUpiId());

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

        if (payout.getStatus() == PayoutStatus.PROCESSED || payout.getStatus() == PayoutStatus.REJECTED) {
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
            String message = request.getStatus() == PayoutStatus.PROCESSED
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
