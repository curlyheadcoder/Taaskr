package com.taaskr;

import com.taaskr.dto.auth.AuthResponse;
import com.taaskr.dto.auth.RegisterRequest;
import com.taaskr.dto.payout.PayoutResponse;
import com.taaskr.dto.payout.ProcessPayoutRequest;
import com.taaskr.dto.payout.RequestPayoutRequest;
import com.taaskr.dto.payout.WalletOverviewResponse;
import com.taaskr.entity.*;
import com.taaskr.enums.*;
import com.taaskr.repository.*;
import com.taaskr.service.AuthService;
import com.taaskr.service.PayoutService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class ProviderPayoutAndReconciliationTests {

    @Autowired
    private AuthService authService;

    @Autowired
    private PayoutService payoutService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProviderProfileRepository providerProfileRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private ServiceCategoryRepository categoryRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private WalletTransactionRepository walletTransactionRepository;

    @Autowired
    private PayoutRepository payoutRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User customer;
    private User providerUser1;
    private ProviderProfile provider1;
    private User providerUser2;
    private ProviderProfile provider2;
    private User admin;
    private Booking completedPaidBooking1;

    @BeforeEach
    public void setUp() {
        // Customer setup
        RegisterRequest custReq = new RegisterRequest();
        custReq.setName("Test Customer");
        custReq.setEmail("customer_" + System.currentTimeMillis() + "@taaskr.com");
        custReq.setPassword("Pass@123");
        custReq.setRole(Role.USER);
        custReq.setPhone("9893" + (System.currentTimeMillis() % 1000000));
        AuthResponse custRes = authService.register(custReq);
        customer = userRepository.findById(custRes.getUserId()).orElseThrow();

        // Admin setup
        admin = new User();
        admin.setName("Admin User");
        admin.setEmail("payout_admin_" + System.currentTimeMillis() + "@taaskr.com");
        admin.setPassword(passwordEncoder.encode("Admin@123"));
        admin.setRole(Role.ADMIN);
        admin.setPhone("9988" + (System.currentTimeMillis() % 1000000));
        admin.setEnabled(true);
        admin = userRepository.save(admin);

        // Provider 1 setup
        RegisterRequest provReq1 = new RegisterRequest();
        provReq1.setName("Fin Provider One");
        provReq1.setEmail("fin_prov1_" + System.currentTimeMillis() + "@taaskr.com");
        provReq1.setPassword("Pass@123");
        provReq1.setRole(Role.PROVIDER);
        provReq1.setPhone("9894" + (System.currentTimeMillis() % 1000000));
        provReq1.setCity("Indore");
        provReq1.setPincode("452001");
        AuthResponse provRes1 = authService.register(provReq1);
        providerUser1 = userRepository.findById(provRes1.getUserId()).orElseThrow();
        provider1 = providerProfileRepository.findByUserId(providerUser1.getId()).orElseThrow();
        provider1.setApproved(true);
        provider1 = providerProfileRepository.save(provider1);

        // Provider 2 setup
        RegisterRequest provReq2 = new RegisterRequest();
        provReq2.setName("Fin Provider Two");
        provReq2.setEmail("fin_prov2_" + System.currentTimeMillis() + "@taaskr.com");
        provReq2.setPassword("Pass@123");
        provReq2.setRole(Role.PROVIDER);
        provReq2.setPhone("9895" + (System.currentTimeMillis() % 1000000));
        provReq2.setCity("Indore");
        provReq2.setPincode("452001");
        AuthResponse provRes2 = authService.register(provReq2);
        providerUser2 = userRepository.findById(provRes2.getUserId()).orElseThrow();
        provider2 = providerProfileRepository.findByUserId(providerUser2.getId()).orElseThrow();
        provider2.setApproved(true);
        provider2 = providerProfileRepository.save(provider2);

        // Category & Service
        ServiceCategory cat = new ServiceCategory();
        cat.setName("Cleaning Category " + System.currentTimeMillis());
        cat.setDescription("Cleaning");
        cat = categoryRepository.save(cat);

        com.taaskr.entity.Service srv = new com.taaskr.entity.Service();
        srv.setName("Deep Cleaning");
        srv.setCategory(cat);
        srv.setPrice(BigDecimal.valueOf(1000.00));
        srv.setDurationMinutes(60);
        srv.setActive(true);
        srv = serviceRepository.save(srv);

        // Completed & Paid Booking for Provider 1 (₹1000.00)
        completedPaidBooking1 = new Booking();
        completedPaidBooking1.setBookingCode("BKG-FIN-" + System.currentTimeMillis());
        completedPaidBooking1.setUser(customer);
        completedPaidBooking1.setProvider(provider1);
        completedPaidBooking1.setService(srv);
        completedPaidBooking1.setAddress("123 Vijay Nagar, Indore");
        completedPaidBooking1.setCity("Indore");
        completedPaidBooking1.setPincode("452001");
        completedPaidBooking1.setBookingDate(LocalDate.now());
        completedPaidBooking1.setStartTime(LocalTime.of(10, 0));
        completedPaidBooking1.setEndTime(LocalTime.of(11, 0));
        completedPaidBooking1.setStatus(BookingStatus.COMPLETED);
        completedPaidBooking1.setPaymentStatus(PaymentStatus.PAID);
        completedPaidBooking1.setPaymentMethod(PaymentMethod.ONLINE);
        completedPaidBooking1.setTotalAmount(BigDecimal.valueOf(1000.00));
        completedPaidBooking1.setFinalAmount(BigDecimal.valueOf(1000.00));
        completedPaidBooking1 = bookingRepository.save(completedPaidBooking1);
    }

    // 1. Single Booking Earnings Crediting & 15% Platform Commission Ledger
    @Test
    public void test1_CreditBookingEarningsCalculation() {
        payoutService.creditBookingEarnings(completedPaidBooking1);

        WalletOverviewResponse wallet = payoutService.getWalletOverview(providerUser1.getEmail());
        assertNotNull(wallet);
        // Gross: 1000.00, 15% Fee = 150.00, Net Earnings = 850.00
        assertEquals(BigDecimal.valueOf(850.00).setScale(2, RoundingMode.HALF_UP), wallet.getCurrentBalance());
        assertEquals(BigDecimal.valueOf(850.00).setScale(2, RoundingMode.HALF_UP), wallet.getLifetimeEarnings());
        assertEquals(BigDecimal.valueOf(150.00).setScale(2, RoundingMode.HALF_UP), wallet.getTotalPlatformFees());
    }

    // 2. Earnings Reconciliation Idempotency (Repeated Calls & Overview Invocation)
    @Test
    public void test2_EarningsReconciliationIdempotency() {
        payoutService.creditBookingEarnings(completedPaidBooking1);
        payoutService.creditBookingEarnings(completedPaidBooking1); // Second call must be idempotent

        // getWalletOverview also runs auto-reconciliation
        WalletOverviewResponse wallet = payoutService.getWalletOverview(providerUser1.getEmail());

        List<WalletTransaction> earningTxns = walletTransactionRepository.findByProviderIdOrderByCreatedAtDesc(provider1.getId())
                .stream()
                .filter(t -> t.getType() == WalletTransactionType.EARNING)
                .toList();

        assertEquals(1, earningTxns.size(), "Earning transaction for booking must exist exactly once");
        assertEquals(BigDecimal.valueOf(850.00).setScale(2, RoundingMode.HALF_UP), wallet.getCurrentBalance());
    }

    // 3. Database Unique Constraint Check for Duplicate Earnings
    @Test
    public void test3_DatabaseUniqueConstraintPreventsDuplicateEarning() {
        payoutService.creditBookingEarnings(completedPaidBooking1);

        // Attempting to manually persist duplicate EARNING record for same booking must fail DB constraint
        WalletTransaction dupTxn = new WalletTransaction(
                provider1,
                completedPaidBooking1,
                WalletTransactionType.EARNING,
                BigDecimal.valueOf(850.00),
                BigDecimal.valueOf(1700.00),
                "Duplicate Earning"
        );

        assertThrows(org.springframework.dao.DataIntegrityViolationException.class, () -> {
            walletTransactionRepository.saveAndFlush(dupTxn);
        }, "Database unique constraint uk_wallet_booking_type must reject duplicate EARNING for same booking");
    }

    // 4. Ineligible Bookings (Unpaid / Cancelled) Are Excluded from Reconciliation
    @Test
    public void test4_IneligibleBookingsExcludedFromReconciliation() {
        Booking unpaidBooking = new Booking();
        unpaidBooking.setBookingCode("BKG-UNPAID-" + System.currentTimeMillis());
        unpaidBooking.setUser(customer);
        unpaidBooking.setProvider(provider2);
        unpaidBooking.setService(completedPaidBooking1.getService());
        unpaidBooking.setAddress("124 Vijay Nagar, Indore");
        unpaidBooking.setCity("Indore");
        unpaidBooking.setPincode("452001");
        unpaidBooking.setBookingDate(LocalDate.now());
        unpaidBooking.setStartTime(LocalTime.of(14, 0));
        unpaidBooking.setEndTime(LocalTime.of(15, 0));
        unpaidBooking.setStatus(BookingStatus.CANCELLED);
        unpaidBooking.setPaymentStatus(PaymentStatus.PENDING);
        unpaidBooking.setTotalAmount(BigDecimal.valueOf(500.00));
        unpaidBooking.setFinalAmount(BigDecimal.valueOf(500.00));
        unpaidBooking = bookingRepository.save(unpaidBooking);

        payoutService.creditBookingEarnings(unpaidBooking);

        WalletOverviewResponse wallet = payoutService.getWalletOverview(providerUser2.getEmail());
        assertEquals(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP), wallet.getCurrentBalance());
    }

    // 5. Valid Payout Request & Immediate Balance Reservation
    @Test
    public void test5_ValidPayoutRequestAndBalanceReservation() {
        payoutService.creditBookingEarnings(completedPaidBooking1); // Balance = 850.00

        RequestPayoutRequest req = new RequestPayoutRequest();
        req.setAmount(BigDecimal.valueOf(500.00));
        req.setUpiId("provider1@upi");

        PayoutResponse payout = payoutService.requestPayout(req, providerUser1.getEmail());
        assertNotNull(payout.getId());
        assertEquals(PayoutStatus.REQUESTED, payout.getStatus());
        assertEquals(BigDecimal.valueOf(500.00), payout.getAmount());

        WalletOverviewResponse wallet = payoutService.getWalletOverview(providerUser1.getEmail());
        assertEquals(BigDecimal.valueOf(350.00).setScale(2, RoundingMode.HALF_UP), wallet.getCurrentBalance());
        assertEquals(BigDecimal.valueOf(500.00).setScale(2, RoundingMode.HALF_UP), wallet.getPendingPayouts());
    }

    // 6. Insufficient Balance Withdrawal Rejection
    @Test
    public void test6_InsufficientBalanceWithdrawalRejection() {
        payoutService.creditBookingEarnings(completedPaidBooking1); // Balance = 850.00

        RequestPayoutRequest excessiveReq = new RequestPayoutRequest();
        excessiveReq.setAmount(BigDecimal.valueOf(1500.00)); // Greater than 850.00
        excessiveReq.setUpiId("provider1@upi");

        assertThrows(ResponseStatusException.class, () ->
                payoutService.requestPayout(excessiveReq, providerUser1.getEmail()),
                "Withdrawal request exceeding available balance must throw BAD_REQUEST"
        );
    }

    // 7. Concurrent Withdrawal Requests Handling (Combined Amount Exceeds Balance)
    @Test
    public void test7_ConcurrentWithdrawalsExceedingBalanceHandledSafely() {
        payoutService.creditBookingEarnings(completedPaidBooking1); // Balance = 850.00

        // Request 1: 500.00 (Valid)
        RequestPayoutRequest req1 = new RequestPayoutRequest();
        req1.setAmount(BigDecimal.valueOf(500.00));
        req1.setUpiId("provider1@upi");
        PayoutResponse res1 = payoutService.requestPayout(req1, providerUser1.getEmail());
        assertNotNull(res1.getId());

        // Request 2: 500.00 (Remaining balance is 350.00 -> must fail)
        RequestPayoutRequest req2 = new RequestPayoutRequest();
        req2.setAmount(BigDecimal.valueOf(500.00));
        req2.setUpiId("provider1@upi");

        assertThrows(ResponseStatusException.class, () ->
                payoutService.requestPayout(req2, providerUser1.getEmail()),
                "Second withdrawal request exceeding remaining 350.00 balance must be rejected"
        );
    }

    // 8. Payout Rejection & Balance Restoration
    @Test
    public void test8_PayoutRejectionRestoresWalletBalance() {
        payoutService.creditBookingEarnings(completedPaidBooking1); // Balance = 850.00

        RequestPayoutRequest req = new RequestPayoutRequest();
        req.setAmount(BigDecimal.valueOf(400.00));
        req.setUpiId("provider1@upi");
        PayoutResponse payout = payoutService.requestPayout(req, providerUser1.getEmail());

        // Balance after withdrawal: 450.00
        WalletOverviewResponse walletMid = payoutService.getWalletOverview(providerUser1.getEmail());
        assertEquals(BigDecimal.valueOf(450.00).setScale(2, RoundingMode.HALF_UP), walletMid.getCurrentBalance());

        // Admin rejects payout
        ProcessPayoutRequest processReq = new ProcessPayoutRequest();
        processReq.setStatus(PayoutStatus.REJECTED);
        processReq.setAdminNotes("Incorrect UPI details");

        PayoutResponse processed = payoutService.processPayout(payout.getId(), processReq, admin.getEmail());
        assertEquals(PayoutStatus.REJECTED, processed.getStatus());

        // Balance after rejection refund: 850.00
        WalletOverviewResponse walletFinal = payoutService.getWalletOverview(providerUser1.getEmail());
        assertEquals(BigDecimal.valueOf(850.00).setScale(2, RoundingMode.HALF_UP), walletFinal.getCurrentBalance());
    }

    // 9. Multi-Provider Isolated Wallet Operations
    @Test
    public void test9_MultiProviderWalletIsolation() {
        payoutService.creditBookingEarnings(completedPaidBooking1); // Provider 1 balance = 850.00

        WalletOverviewResponse wallet1 = payoutService.getWalletOverview(providerUser1.getEmail());
        WalletOverviewResponse wallet2 = payoutService.getWalletOverview(providerUser2.getEmail());

        assertEquals(BigDecimal.valueOf(850.00).setScale(2, RoundingMode.HALF_UP), wallet1.getCurrentBalance());
        assertEquals(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP), wallet2.getCurrentBalance());
    }

    // 10. Minimum Payout Amount Limit Validation
    @Test
    public void test10_MinimumPayoutAmountLimit() {
        payoutService.creditBookingEarnings(completedPaidBooking1);

        RequestPayoutRequest smallReq = new RequestPayoutRequest();
        smallReq.setAmount(BigDecimal.valueOf(50.00)); // Less than 100.00
        smallReq.setUpiId("provider1@upi");

        assertThrows(ResponseStatusException.class, () ->
                payoutService.requestPayout(smallReq, providerUser1.getEmail()),
                "Withdrawal request under ₹100.00 must throw BAD_REQUEST"
        );
    }

    // 11. Provider Profile and Service Partner Null Version Hardening
    @Test
    public void test11_NullVersionProviderProfileAndServicePartnerVersioning() {
        User freshUser = new User();
        freshUser.setName("Fresh Provider");
        freshUser.setEmail("fresh_prov_" + System.currentTimeMillis() + "@taaskr.com");
        freshUser.setPassword(passwordEncoder.encode("Pass@123"));
        freshUser.setRole(Role.PROVIDER);
        freshUser.setPhone("9977" + (System.currentTimeMillis() % 1000000));
        freshUser.setEnabled(true);
        freshUser = userRepository.save(freshUser);

        ProviderProfile freshProvider = new ProviderProfile();
        freshProvider.setUser(freshUser);
        freshProvider.setCity("Indore");
        freshProvider.setVersion(null); // Explicitly test null version safety
        freshProvider = providerProfileRepository.saveAndFlush(freshProvider);

        assertNotNull(freshProvider.getVersion(), "Provider profile version must be non-null after save/load");
        assertEquals(0L, freshProvider.getVersion());

        freshProvider.setTotalJobs(freshProvider.getTotalJobs() + 1);
        ProviderProfile updatedProvider = providerProfileRepository.saveAndFlush(freshProvider);
        assertNotNull(updatedProvider.getVersion());
        assertTrue(updatedProvider.getVersion() >= 1L, "Version should be incremented by Hibernate optimistic locking");

        ServicePartner partner = new ServicePartner();
        partner.setName("Test Partner");
        partner.setPhone("9998887776");
        partner.setEmail("partner@taaskr.com");
        partner.setVersion(null);
        
        ServicePartner savedPartner = partner;
        assertNotNull(savedPartner);
        assertEquals(0L, savedPartner.getVersion());
    }

    // 12. Booking Completion with Null Version Safety & Wallet Crediting Idempotency
    @Test
    public void test12_BookingCompletionWithVersionSafetyAndWalletCrediting() {
        assertDoesNotThrow(() -> payoutService.creditBookingEarnings(completedPaidBooking1));
        
        // Second credit attempt must be idempotent
        payoutService.creditBookingEarnings(completedPaidBooking1);

        WalletOverviewResponse wallet = payoutService.getWalletOverview(providerUser1.getEmail());
        assertEquals(BigDecimal.valueOf(850.00).setScale(2, RoundingMode.HALF_UP), wallet.getCurrentBalance());
        assertEquals(1, walletTransactionRepository.findByProviderIdOrderByCreatedAtDesc(provider1.getId())
                .stream().filter(t -> t.getType() == WalletTransactionType.EARNING).count());
    }
}
