package com.taaskr;

import com.taaskr.dto.address.AddressResponse;
import com.taaskr.dto.address.CreateAddressRequest;
import com.taaskr.dto.dispute.CreateDisputeRequest;
import com.taaskr.dto.dispute.DisputeResponse;
import com.taaskr.dto.notification.NotificationResponse;
import com.taaskr.dto.payout.WalletOverviewResponse;
import com.taaskr.dto.review.CreateReviewRequest;
import com.taaskr.dto.review.ReviewResponse;
import com.taaskr.entity.*;
import com.taaskr.enums.*;
import com.taaskr.repository.*;
import com.taaskr.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class ProductionModernizationTests {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProviderProfileRepository providerProfileRepository;

    @Autowired
    private ServiceCategoryRepository categoryRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private AddressService addressService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private ReviewService reviewService;

    @Autowired
    private PayoutService payoutService;

    @Autowired
    private DisputeService disputeService;

    @Autowired
    private InvoicePdfService invoicePdfService;

    @Autowired
    private AdminBookingService adminBookingService;

    @Autowired
    private AdminUserService adminUserService;

    @Autowired
    private AdminProviderService adminProviderService;

    @Autowired
    private BookingService bookingService;

    @Autowired
    private ProviderWorkflowService providerWorkflowService;

    private User testCustomer;
    private User testProviderUser;
    private ProviderProfile testProvider;
    private Service testService;
    private Booking testBooking;

    @BeforeEach
    void setUp() {
        testCustomer = new User();
        testCustomer.setName("Alice Customer");
        testCustomer.setEmail("alice@test.com");
        testCustomer.setPassword("hashedpass");
        testCustomer.setPhone("9876543210");
        testCustomer.setRole(Role.USER);
        testCustomer.setEmailVerified(true);
        testCustomer.setPhoneVerified(true);
        testCustomer = userRepository.save(testCustomer);

        testProviderUser = new User();
        testProviderUser.setName("Bob Provider");
        testProviderUser.setEmail("bob@provider.com");
        testProviderUser.setPassword("hashedpass");
        testProviderUser.setPhone("9876543211");
        testProviderUser.setRole(Role.PROVIDER);
        testProviderUser.setEmailVerified(true);
        testProviderUser.setPhoneVerified(true);
        testProviderUser = userRepository.save(testProviderUser);

        testProvider = new ProviderProfile();
        testProvider.setUser(testProviderUser);
        testProvider.setCity("Indore");
        testProvider.setPincode("452001");
        testProvider.setApproved(true);
        testProvider.setRating(5.0);
        testProvider.setTotalRatings(1);
        testProvider.setTotalJobs(1);
        testProvider = providerProfileRepository.save(testProvider);

        ServiceCategory cat = new ServiceCategory();
        cat.setName("Appliance Repair");
        cat.setDescription("Appliance repairs");
        cat.setActive(true);
        cat = categoryRepository.save(cat);

        testService = new Service();
        testService.setName("AC Deep Clean");
        testService.setCategory(cat);
        testService.setPrice(BigDecimal.valueOf(499.00));
        testService.setDurationMinutes(60);
        testService.setActive(true);
        testService = serviceRepository.save(testService);

        testBooking = new Booking();
        testBooking.setBookingCode("TSK-TEST-99");
        testBooking.setUser(testCustomer);
        testBooking.setProvider(testProvider);
        testBooking.setService(testService);
        testBooking.setBookingDate(LocalDate.now());
        testBooking.setStartTime(LocalTime.of(10, 0));
        testBooking.setEndTime(LocalTime.of(11, 0));
        testBooking.setAddress("123 Test Street");
        testBooking.setCity("Indore");
        testBooking.setPincode("452001");
        testBooking.setStatus(BookingStatus.COMPLETED);
        testBooking.setPaymentMethod(PaymentMethod.ONLINE);
        testBooking.setPaymentStatus(PaymentStatus.PAID);
        testBooking.setTotalAmount(BigDecimal.valueOf(499.00));
        testBooking.setFinalAmount(BigDecimal.valueOf(499.00));
        testBooking = bookingRepository.save(testBooking);
    }

    @Test
    void testAddressBookCrud() {
        CreateAddressRequest req = new CreateAddressRequest();
        req.setLabel(AddressLabel.HOME);
        req.setAddressLine("Flat 402, Sunshine Apartments");
        req.setCity("Indore");
        req.setPincode("452010");
        req.setIsDefault(true);

        AddressResponse created = addressService.addAddress(testCustomer.getEmail(), req);
        assertNotNull(created.getId());
        assertEquals("Indore", created.getCity());
        assertTrue(created.getIsDefault());

        List<AddressResponse> myAddresses = addressService.getMyAddresses(testCustomer.getEmail());
        assertEquals(1, myAddresses.size());
    }

    @Test
    void testPersistentNotificationDelivery() {
        notificationService.sendNotification(
                testCustomer,
                "Welcome to Taaskr",
                "Your account is set up.",
                NotificationType.INFO,
                "SYSTEM",
                null
        );

        List<NotificationResponse> notifs = notificationService.getMyNotifications(testCustomer.getEmail());
        assertFalse(notifs.isEmpty());
        assertEquals("Welcome to Taaskr", notifs.get(0).getTitle());
        assertFalse(notifs.get(0).getIsRead());

        notificationService.markAllAsRead(testCustomer.getEmail());
        List<NotificationResponse> updated = notificationService.getMyNotifications(testCustomer.getEmail());
        assertTrue(updated.get(0).getIsRead());
    }

    @Test
    void testReviewAndRatingSubmission() {
        CreateReviewRequest req = new CreateReviewRequest();
        req.setBookingId(testBooking.getId());
        req.setRating(5);
        req.setQualityRating(5);
        req.setPunctualityRating(5);
        req.setComment("Exceptional technician!");

        ReviewResponse response = reviewService.createReview(req, testCustomer.getEmail());
        assertNotNull(response.getId());
        assertEquals(5, response.getRating());

        List<ReviewResponse> srvReviews = reviewService.getReviewsByService(testService.getId());
        assertFalse(srvReviews.isEmpty());
        assertEquals("Exceptional technician!", srvReviews.get(0).getComment());
    }

    @Test
    void testProviderWalletAndCommissionLedger() {
        payoutService.creditBookingEarnings(testBooking);

        WalletOverviewResponse wallet = payoutService.getWalletOverview(testProviderUser.getEmail());
        assertNotNull(wallet);
        // 499 * 0.85 = 424.15 net earnings
        assertTrue(wallet.getCurrentBalance().compareTo(BigDecimal.ZERO) > 0);
        assertTrue(wallet.getTotalPlatformFees().compareTo(BigDecimal.ZERO) > 0);
    }

    @Test
    void testCustomerDisputeCreation() {
        CreateDisputeRequest req = new CreateDisputeRequest();
        req.setBookingId(testBooking.getId());
        req.setReason("Service delayed");
        req.setDescription("Technician arrived 2 hours late.");

        DisputeResponse dispute = disputeService.createDispute(req, testCustomer.getEmail());
        assertNotNull(dispute.getId());
        assertEquals(DisputeStatus.OPEN, dispute.getStatus());

        List<DisputeResponse> myDisputes = disputeService.getMyDisputes(testCustomer.getEmail());
        assertEquals(1, myDisputes.size());
    }

    @Test
    void testInvoicePdfGeneration() {
        byte[] pdfBytes = invoicePdfService.generateInvoicePdf(testBooking.getId(), testCustomer.getEmail());
        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 500, "PDF should contain header, tables, and footer metadata");
        // Check standard PDF file signature: %PDF
        assertEquals('%', (char) pdfBytes[0]);
        assertEquals('P', (char) pdfBytes[1]);
        assertEquals('D', (char) pdfBytes[2]);
        assertEquals('F', (char) pdfBytes[3]);
    }

    @Test
    void testPageableAPIs() {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(0, 10);
        
        var bookingsPage = adminBookingService.getAllBookings(pageable);
        assertNotNull(bookingsPage);
        assertTrue(bookingsPage.getTotalElements() >= 1);
        assertFalse(bookingsPage.getContent().isEmpty());

        var usersPage = adminUserService.getAllUsers(pageable);
        assertNotNull(usersPage);
        assertTrue(usersPage.getTotalElements() >= 2);

        var providersPage = adminProviderService.getAllProviders(pageable);
        assertNotNull(providersPage);
        assertTrue(providersPage.getTotalElements() >= 1);

        var myBookingsPage = bookingService.getMyBookings(testCustomer.getEmail(), pageable);
        assertNotNull(myBookingsPage);
        assertTrue(myBookingsPage.getTotalElements() >= 1);
    }

    @Autowired
    private KycDocumentService kycDocumentService;

    @Test
    void testKycDocumentLifecycle() {
        // 1. Provider uploads an Aadhaar card
        org.springframework.mock.web.MockMultipartFile mockFile = new org.springframework.mock.web.MockMultipartFile(
                "file",
                "aadhaar_front.png",
                "image/png",
                "Sample PNG image bytes for Aadhaar".getBytes()
        );

        var uploadedDoc = kycDocumentService.uploadDocument(
                testProviderUser.getEmail(),
                KycDocumentType.AADHAAR_FRONT,
                "1234-5678-9012",
                mockFile
        );

        assertNotNull(uploadedDoc.getId());
        assertEquals(KycDocumentType.AADHAAR_FRONT, uploadedDoc.getDocumentType());
        assertEquals(KycDocumentStatus.PENDING, uploadedDoc.getStatus());
        assertEquals("1234-5678-9012", uploadedDoc.getDocumentNumber());
        assertEquals("aadhaar_front.png", uploadedDoc.getOriginalFileName());

        // 2. Provider checks their KYC document list
        var myDocs = kycDocumentService.getMyDocuments(testProviderUser.getEmail());
        assertEquals(1, myDocs.size());
        assertEquals(uploadedDoc.getId(), myDocs.get(0).getId());

        // 3. Admin user setup & document verification
        User adminUser = new User();
        adminUser.setName("Super Admin");
        adminUser.setEmail("admin@taaskr.com");
        adminUser.setPassword("adminpass");
        adminUser.setPhone("9999988888");
        adminUser.setRole(Role.ADMIN);
        adminUser.setEmailVerified(true);
        adminUser.setPhoneVerified(true);
        adminUser = userRepository.save(adminUser);

        var verifyReq = new com.taaskr.dto.kyc.VerifyKycRequest(KycDocumentStatus.VERIFIED, null);
        var verifiedDoc = kycDocumentService.verifyDocument(uploadedDoc.getId(), verifyReq, adminUser.getEmail());

        assertEquals(KycDocumentStatus.VERIFIED, verifiedDoc.getStatus());
        assertNotNull(verifiedDoc.getVerifiedAt());
        assertEquals("Super Admin", verifiedDoc.getVerifiedByName());

        // 4. Admin document query
        var allDocs = kycDocumentService.getAllDocuments(KycDocumentStatus.VERIFIED, 0, 10);
        assertTrue(allDocs.getTotalElements() >= 1);
    }

    @Test
    void testFutureBookingCannotBeStartedBeforeScheduledTime() {
        // Create a booking for tomorrow at 14:00
        Booking futureBooking = new Booking();
        futureBooking.setBookingCode("TSK-FUTURE-01");
        futureBooking.setUser(testCustomer);
        futureBooking.setProvider(testProvider);
        futureBooking.setService(testService);
        futureBooking.setBookingDate(LocalDate.now().plusDays(1));
        futureBooking.setStartTime(LocalTime.of(14, 0));
        futureBooking.setEndTime(LocalTime.of(15, 0));
        futureBooking.setAddress("456 Future Lane");
        futureBooking.setCity("Indore");
        futureBooking.setPincode("452001");
        futureBooking.setStatus(BookingStatus.ASSIGNED);
        futureBooking.setPaymentMethod(PaymentMethod.ONLINE);
        futureBooking.setPaymentStatus(PaymentStatus.PAID);
        futureBooking.setTotalAmount(BigDecimal.valueOf(499.00));
        futureBooking.setFinalAmount(BigDecimal.valueOf(499.00));
        Booking savedFutureBooking = bookingRepository.save(futureBooking);
        final Long futureBookingId = savedFutureBooking.getId();

        // 1. Provider accepts the future task -> must succeed
        var acceptedResponse = providerWorkflowService.acceptBooking(testProviderUser.getEmail(), futureBookingId);
        assertEquals(BookingStatus.ACCEPTED, acceptedResponse.getStatus());

        // 2. Provider tries to start work (IN_PROGRESS) on future task -> must throw BadRequestException
        var startRequest = new com.taaskr.dto.provider.UpdateProviderBookingStatusRequest();
        startRequest.setStatus(BookingStatus.IN_PROGRESS);

        var ex = assertThrows(com.taaskr.exception.BadRequestException.class, () -> {
            providerWorkflowService.updateBookingStatus(testProviderUser.getEmail(), futureBookingId, startRequest);
        });
        assertTrue(ex.getMessage().contains("Cannot start work before the assigned booking time"));

        // 3. Provider tries to start transit (IN_TRANSIT) on future task -> must also throw BadRequestException
        var transitRequest = new com.taaskr.dto.provider.UpdateProviderBookingStatusRequest();
        transitRequest.setStatus(BookingStatus.IN_TRANSIT);

        var exTransit = assertThrows(com.taaskr.exception.BadRequestException.class, () -> {
            providerWorkflowService.updateBookingStatus(testProviderUser.getEmail(), futureBookingId, transitRequest);
        });
        assertTrue(exTransit.getMessage().contains("Cannot start work before the assigned booking time"));

        // 4. Update the booking date/time to the past/current moment -> provider can now start work
        savedFutureBooking.setBookingDate(LocalDate.now().minusDays(1));
        bookingRepository.save(savedFutureBooking);

        var startedResponse = providerWorkflowService.updateBookingStatus(testProviderUser.getEmail(), futureBookingId, startRequest);
        assertEquals(BookingStatus.IN_PROGRESS, startedResponse.getStatus());
    }
}
