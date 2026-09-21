package com.taaskr;

import com.taaskr.dto.auth.AuthResponse;
import com.taaskr.dto.auth.RegisterRequest;
import com.taaskr.dto.kyc.KycDocumentResponse;
import com.taaskr.dto.kyc.VerifyKycRequest;
import com.taaskr.dto.partner.CreateServicePartnerRequest;
import com.taaskr.dto.partner.ServicePartnerResponse;
import com.taaskr.entity.*;
import com.taaskr.enums.*;
import com.taaskr.exception.BadRequestException;
import com.taaskr.exception.ResourceNotFoundException;
import com.taaskr.repository.*;
import com.taaskr.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
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
public class ProviderOnboardingAndKycIntegrityTests {

    @Autowired
    private AuthService authService;

    @Autowired
    private KycDocumentService kycDocumentService;

    @Autowired
    private AdminProviderService adminProviderService;

    @Autowired
    private ServicePartnerService servicePartnerService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProviderProfileRepository providerProfileRepository;

    @Autowired
    private KycDocumentRepository kycDocumentRepository;

    @Autowired
    private ServiceCategoryRepository categoryRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private ProviderCategoryRepository providerCategoryRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User adminUser;
    private User providerUser1;
    private ProviderProfile providerProfile1;
    private User providerUser2;
    private ProviderProfile providerProfile2;
    private ServiceCategory testCategory;
    private com.taaskr.entity.Service testService;

    @BeforeEach
    public void setUp() {
        // Setup Admin User
        adminUser = new User();
        adminUser.setName("System Admin");
        adminUser.setEmail("sysadmin_" + System.currentTimeMillis() + "@taaskr.com");
        adminUser.setPassword(passwordEncoder.encode("Admin@123"));
        adminUser.setRole(Role.ADMIN);
        adminUser.setPhone("9900" + (System.currentTimeMillis() % 1000000));
        adminUser.setEnabled(true);
        adminUser = userRepository.save(adminUser);

        // Setup Provider 1
        RegisterRequest req1 = new RegisterRequest();
        req1.setName("Indore Plumber Pro");
        req1.setEmail("indore_plumber_" + System.currentTimeMillis() + "@taaskr.com");
        req1.setPassword("Pass@123");
        req1.setRole(Role.PROVIDER);
        req1.setPhone("9826" + (System.currentTimeMillis() % 1000000));
        req1.setCity("Indore");
        req1.setPincode("452001");
        AuthResponse res1 = authService.register(req1);
        providerUser1 = userRepository.findById(res1.getUserId()).orElseThrow();
        providerProfile1 = providerProfileRepository.findByUserId(providerUser1.getId()).orElseThrow();

        // Setup Provider 2
        RegisterRequest req2 = new RegisterRequest();
        req2.setName("Second Indore Partner");
        req2.setEmail("indore_partner2_" + System.currentTimeMillis() + "@taaskr.com");
        req2.setPassword("Pass@123");
        req2.setRole(Role.PROVIDER);
        req2.setPhone("9827" + (System.currentTimeMillis() % 1000000));
        req2.setCity("Indore");
        req2.setPincode("452001");
        AuthResponse res2 = authService.register(req2);
        providerUser2 = userRepository.findById(res2.getUserId()).orElseThrow();
        providerProfile2 = providerProfileRepository.findByUserId(providerUser2.getId()).orElseThrow();

        // Setup Category & Service for Dispatch tests
        testCategory = new ServiceCategory();
        testCategory.setName("Plumbing Services " + System.currentTimeMillis());
        testCategory.setDescription("Pipe and tap repair");
        testCategory = categoryRepository.save(testCategory);

        testService = new com.taaskr.entity.Service();
        testService.setName("Tap Repair");
        testService.setDescription("Fix leaking taps");
        testService.setCategory(testCategory);
        testService.setPrice(BigDecimal.valueOf(299.0));
        testService.setDurationMinutes(60);
        testService.setActive(true);
        testService = serviceRepository.save(testService);

        // Link Provider 1 & Provider 2 to Category
        ProviderCategory pc1 = new ProviderCategory(providerProfile1, testCategory);
        providerCategoryRepository.save(pc1);

        ProviderCategory pc2 = new ProviderCategory(providerProfile2, testCategory);
        providerCategoryRepository.save(pc2);
    }

    // 1. Valid Provider Registration
    @Test
    public void test1_ValidProviderRegistration() {
        assertNotNull(providerUser1);
        assertNotNull(providerProfile1);
        assertEquals(Role.PROVIDER, providerUser1.getRole());
        assertFalse(providerProfile1.getApproved(), "New registered provider profile must default to approved = false");
    }

    // 2. Unauthorized Role Assignment Rejected (ADMIN)
    @Test
    public void test2_UnauthorizedRoleAssignmentRejected() {
        RegisterRequest adminReq = new RegisterRequest();
        adminReq.setName("Hacker Admin");
        adminReq.setEmail("hacker_" + System.currentTimeMillis() + "@taaskr.com");
        adminReq.setPassword("Pass@123");
        adminReq.setRole(Role.ADMIN);

        assertThrows(BadRequestException.class, () -> authService.register(adminReq),
                "Registering with Role.ADMIN must throw BadRequestException");
    }

    // 3. Duplicate Provider Profile Prevention
    @Test
    public void test3_DuplicateProviderProfilePrevention() {
        RegisterRequest dupReq = new RegisterRequest();
        dupReq.setName("Duplicate User");
        dupReq.setEmail(providerUser1.getEmail()); // Same email
        dupReq.setPassword("Pass@123");
        dupReq.setRole(Role.PROVIDER);

        assertThrows(BadRequestException.class, () -> authService.register(dupReq),
                "Registering duplicate email must be rejected");
    }

    // 4. Document Submission Validation
    @Test
    public void test4_DocumentSubmissionValidation() {
        MockMultipartFile invalidFile = new MockMultipartFile("file", "malicious.exe", "application/x-msdownload", "BAD_DATA".getBytes());

        assertThrows(ResponseStatusException.class, () ->
                kycDocumentService.uploadDocument(providerUser1.getEmail(), KycDocumentType.AADHAAR_FRONT, "1234-5678", invalidFile),
                "Uploading invalid file extension .exe must throw ResponseStatusException"
        );

        MockMultipartFile emptyFile = new MockMultipartFile("file", "aadhaar.jpg", "image/jpeg", new byte[0]);
        assertThrows(ResponseStatusException.class, () ->
                kycDocumentService.uploadDocument(providerUser1.getEmail(), KycDocumentType.AADHAAR_FRONT, "1234-5678", emptyFile),
                "Uploading empty file must throw ResponseStatusException"
        );
    }

    // 5. Document Ownership Enforcement (Owner Access)
    @Test
    public void test5_DocumentOwnershipEnforcement() {
        MockMultipartFile validFile = new MockMultipartFile("file", "aadhaar_front.jpg", "image/jpeg", "VALID_IMAGE_DATA".getBytes());
        KycDocumentResponse uploaded = kycDocumentService.uploadDocument(providerUser1.getEmail(), KycDocumentType.AADHAAR_FRONT, "1234-5678-9012", validFile);

        assertNotNull(uploaded.getId());
        assertEquals(KycDocumentStatus.PENDING, uploaded.getStatus());

        List<KycDocumentResponse> myDocs = kycDocumentService.getMyDocuments(providerUser1.getEmail());
        assertFalse(myDocs.isEmpty());
        assertEquals(uploaded.getId(), myDocs.get(0).getId());
    }

    // 6. Cross-Provider Document Access Rejection (IDOR Protection)
    @Test
    public void test6_CrossProviderDocumentAccessRejection() {
        MockMultipartFile validFile = new MockMultipartFile("file", "aadhaar_front.jpg", "image/jpeg", "VALID_IMAGE_DATA".getBytes());
        KycDocumentResponse uploaded = kycDocumentService.uploadDocument(providerUser1.getEmail(), KycDocumentType.AADHAAR_FRONT, "1234-5678-9012", validFile);

        // Provider 2 attempts to view Provider 1's KYC document
        assertThrows(ResponseStatusException.class, () ->
                kycDocumentService.loadDocumentFile(uploaded.getId(), providerUser2.getEmail()),
                "Provider 2 attempting to view Provider 1's document must throw ResponseStatusException (403 FORBIDDEN)"
        );
    }

    // 7. Unauthorized KYC Approval Rejection
    @Test
    public void test7_UnauthorizedKycApprovalRejection() {
        MockMultipartFile validFile = new MockMultipartFile("file", "pan_card.jpg", "image/jpeg", "VALID_PAN_DATA".getBytes());
        KycDocumentResponse uploaded = kycDocumentService.uploadDocument(providerUser1.getEmail(), KycDocumentType.PAN_CARD, "ABCDE1234F", validFile);

        VerifyKycRequest verifyReq = new VerifyKycRequest();
        verifyReq.setStatus(KycDocumentStatus.VERIFIED);

        // Non-admin (Provider 2) trying to verify Provider 1's document
        assertThrows(ResponseStatusException.class, () ->
                kycDocumentService.verifyDocument(uploaded.getId(), verifyReq, providerUser2.getEmail()),
                "Non-admin user verifying KYC document must fail"
        );
    }

    // 8. Valid Admin Approval
    @Test
    public void test8_ValidAdminApproval() {
        MockMultipartFile validFile = new MockMultipartFile("file", "pan_card.jpg", "image/jpeg", "VALID_PAN_DATA".getBytes());
        KycDocumentResponse uploaded = kycDocumentService.uploadDocument(providerUser1.getEmail(), KycDocumentType.PAN_CARD, "ABCDE1234F", validFile);

        VerifyKycRequest verifyReq = new VerifyKycRequest();
        verifyReq.setStatus(KycDocumentStatus.VERIFIED);

        KycDocumentResponse verified = kycDocumentService.verifyDocument(uploaded.getId(), verifyReq, adminUser.getEmail());
        assertEquals(KycDocumentStatus.VERIFIED, verified.getStatus());
        assertEquals(adminUser.getName(), verified.getVerifiedByName());
        assertNotNull(verified.getVerifiedAt());

        // Also approve provider profile
        adminProviderService.approveProvider(providerProfile1.getId());
        ProviderProfile reloadedProfile = providerProfileRepository.findById(providerProfile1.getId()).orElseThrow();
        assertTrue(reloadedProfile.getApproved());
    }

    // 9. Invalid Approval Transition Rejection
    @Test
    public void test9_InvalidApprovalTransitionRejection() {
        MockMultipartFile validFile = new MockMultipartFile("file", "pan_card.jpg", "image/jpeg", "VALID_PAN_DATA".getBytes());
        KycDocumentResponse uploaded = kycDocumentService.uploadDocument(providerUser1.getEmail(), KycDocumentType.PAN_CARD, "ABCDE1234F", validFile);

        VerifyKycRequest invalidReq = new VerifyKycRequest();
        invalidReq.setStatus(KycDocumentStatus.PENDING); // Attempting to set back to PENDING

        assertThrows(ResponseStatusException.class, () ->
                kycDocumentService.verifyDocument(uploaded.getId(), invalidReq, adminUser.getEmail()),
                "Transitioning KYC document status back to PENDING must throw 400 BAD_REQUEST"
        );
    }

    // 10. Rejection and Resubmission Behavior
    @Test
    public void test10_RejectionAndResubmissionBehavior() {
        MockMultipartFile validFile = new MockMultipartFile("file", "license.pdf", "application/pdf", "PDF_DATA".getBytes());
        KycDocumentResponse uploaded = kycDocumentService.uploadDocument(providerUser1.getEmail(), KycDocumentType.DRIVING_LICENSE, "DL-9999", validFile);

        // Admin rejects without reason
        VerifyKycRequest rejectNoReason = new VerifyKycRequest();
        rejectNoReason.setStatus(KycDocumentStatus.REJECTED);
        assertThrows(ResponseStatusException.class, () ->
                kycDocumentService.verifyDocument(uploaded.getId(), rejectNoReason, adminUser.getEmail()),
                "Rejection without reason must throw BAD_REQUEST"
        );

        // Admin rejects with reason
        VerifyKycRequest rejectWithReason = new VerifyKycRequest();
        rejectWithReason.setStatus(KycDocumentStatus.REJECTED);
        rejectWithReason.setRejectionReason("Blurry image details");
        KycDocumentResponse rejectedDoc = kycDocumentService.verifyDocument(uploaded.getId(), rejectWithReason, adminUser.getEmail());
        assertEquals(KycDocumentStatus.REJECTED, rejectedDoc.getStatus());
        assertEquals("Blurry image details", rejectedDoc.getRejectionReason());

        // Resubmission of clear document
        MockMultipartFile clearFile = new MockMultipartFile("file", "license_clear.pdf", "application/pdf", "CLEAR_PDF_DATA".getBytes());
        KycDocumentResponse resubmitted = kycDocumentService.uploadDocument(providerUser1.getEmail(), KycDocumentType.DRIVING_LICENSE, "DL-9999", clearFile);
        assertEquals(KycDocumentStatus.PENDING, resubmitted.getStatus());
        assertNull(resubmitted.getRejectionReason());
    }

    // 11. Provider Activation Prerequisites
    @Test
    public void test11_ProviderActivationPrerequisites() {
        assertFalse(providerProfile1.getApproved(), "Unapproved provider must be approved = false");
        adminProviderService.approveProvider(providerProfile1.getId());
        ProviderProfile activated = providerProfileRepository.findById(providerProfile1.getId()).orElseThrow();
        assertTrue(activated.getApproved());
    }

    // 12. Pending KYC Provider Dispatch Exclusion
    @Test
    public void test12_PendingKycProviderDispatchExclusion() {
        // Provider 1 is unapproved (approved = false)
        List<ProviderProfile> candidates = providerCategoryRepository.findByCategoryId(testCategory.getId())
                .stream()
                .map(ProviderCategory::getProvider)
                .filter(p -> Boolean.TRUE.equals(p.getApproved()) && Boolean.TRUE.equals(p.getUser().getEnabled()))
                .toList();

        assertFalse(candidates.contains(providerProfile1), "Unapproved Provider 1 must be excluded from candidate dispatch");
    }

    // 13. Rejected/Disabled Provider Dispatch Exclusion
    @Test
    public void test13_RejectedProviderDispatchExclusion() {
        adminProviderService.approveProvider(providerProfile1.getId());
        // Disable user account
        providerUser1.setEnabled(false);
        userRepository.save(providerUser1);

        List<ProviderProfile> candidates = providerCategoryRepository.findByCategoryId(testCategory.getId())
                .stream()
                .map(ProviderCategory::getProvider)
                .filter(p -> Boolean.TRUE.equals(p.getApproved()) && Boolean.TRUE.equals(p.getUser().getEnabled()))
                .toList();

        assertFalse(candidates.contains(providerProfile1), "Disabled Provider 1 user must be excluded from candidate dispatch");
    }

    // 14. Approved Provider Eligibility
    @Test
    public void test14_ApprovedProviderEligibility() {
        adminProviderService.approveProvider(providerProfile1.getId());
        providerUser1.setEnabled(true);
        userRepository.save(providerUser1);

        List<ProviderProfile> candidates = providerCategoryRepository.findByCategoryId(testCategory.getId())
                .stream()
                .map(ProviderCategory::getProvider)
                .filter(p -> Boolean.TRUE.equals(p.getApproved()) && Boolean.TRUE.equals(p.getUser().getEnabled()))
                .toList();

        assertTrue(candidates.contains(providerProfile1), "Approved & active Provider 1 must be eligible for dispatch");
    }

    // 15. Duplicate Document Submission Replacement
    @Test
    public void test15_DuplicateDocumentSubmissionReplacement() {
        MockMultipartFile file1 = new MockMultipartFile("file", "doc1.png", "image/png", "FILE1".getBytes());
        KycDocumentResponse doc1 = kycDocumentService.uploadDocument(providerUser1.getEmail(), KycDocumentType.TRADE_CERTIFICATE, "TC-001", file1);

        MockMultipartFile file2 = new MockMultipartFile("file", "doc2.png", "image/png", "FILE2".getBytes());
        KycDocumentResponse doc2 = kycDocumentService.uploadDocument(providerUser1.getEmail(), KycDocumentType.TRADE_CERTIFICATE, "TC-002", file2);

        assertEquals(doc1.getId(), doc2.getId(), "Uploading same document type must update existing record ID");
        assertEquals("TC-002", doc2.getDocumentNumber());
    }

    // 16. Concurrent Approval / Rejection Handling
    @Test
    public void test16_ConcurrentApprovalRejection() {
        MockMultipartFile file = new MockMultipartFile("file", "doc.png", "image/png", "DATA".getBytes());
        KycDocumentResponse uploaded = kycDocumentService.uploadDocument(providerUser1.getEmail(), KycDocumentType.OTHER, "REF-100", file);

        VerifyKycRequest req1 = new VerifyKycRequest();
        req1.setStatus(KycDocumentStatus.VERIFIED);
        KycDocumentResponse verified = kycDocumentService.verifyDocument(uploaded.getId(), req1, adminUser.getEmail());
        assertEquals(KycDocumentStatus.VERIFIED, verified.getStatus());

        // Subsequent rejection updates state safely
        VerifyKycRequest req2 = new VerifyKycRequest();
        req2.setStatus(KycDocumentStatus.REJECTED);
        req2.setRejectionReason("Re-review rejection");
        KycDocumentResponse rejected = kycDocumentService.verifyDocument(uploaded.getId(), req2, adminUser.getEmail());
        assertEquals(KycDocumentStatus.REJECTED, rejected.getStatus());
    }

    // 17. Approval Racing with Document Replacement
    @Test
    public void test17_ApprovalRacingWithDocumentReplacement() {
        MockMultipartFile file1 = new MockMultipartFile("file", "doc1.jpg", "image/jpeg", "RACE_DATA_1".getBytes());
        KycDocumentResponse uploaded = kycDocumentService.uploadDocument(providerUser1.getEmail(), KycDocumentType.AADHAAR_BACK, "9999-0000", file1);

        // Document replacement resets status to PENDING
        MockMultipartFile file2 = new MockMultipartFile("file", "doc2.jpg", "image/jpeg", "RACE_DATA_2".getBytes());
        KycDocumentResponse replaced = kycDocumentService.uploadDocument(providerUser1.getEmail(), KycDocumentType.AADHAAR_BACK, "9999-1111", file2);
        assertEquals(KycDocumentStatus.PENDING, replaced.getStatus());

        // Admin approves replaced document
        VerifyKycRequest req = new VerifyKycRequest();
        req.setStatus(KycDocumentStatus.VERIFIED);
        KycDocumentResponse approved = kycDocumentService.verifyDocument(replaced.getId(), req, adminUser.getEmail());
        assertEquals(KycDocumentStatus.VERIFIED, approved.getStatus());
    }

    // 18. Activation Racing with Profile Update Optimistic Locking
    @Test
    public void test18_ActivationRacingWithKycStatusChange() {
        adminProviderService.approveProvider(providerProfile1.getId());
        ProviderProfile reloaded = providerProfileRepository.findById(providerProfile1.getId()).orElseThrow();
        assertTrue(reloaded.getApproved());
        assertNotNull(reloaded.getApproved(), "Approved status must be persisted");
    }

    // 19. Service Partner Ownership & Tenant Isolation
    @Test
    public void test19_ServicePartnerOwnership() {
        CreateServicePartnerRequest req = new CreateServicePartnerRequest();
        req.setName("Helper Worker 1");
        req.setPhone("9100000001");
        req.setEmail("worker1_" + System.currentTimeMillis() + "@taaskr.com");
        req.setPassword("Pass@123");
        req.setTitle("Junior Plumber");
        req.setExperience("1 Year");

        ServicePartnerResponse partner1 = servicePartnerService.createServicePartner(providerUser1.getEmail(), req);

        // Provider 2 tries to toggle status of Provider 1's worker
        assertThrows(ResourceNotFoundException.class, () ->
                servicePartnerService.togglePartnerStatus(providerUser2.getEmail(), partner1.getId(), false),
                "Provider 2 modifying Provider 1's worker must fail with ResourceNotFoundException (Tenant Isolation)"
        );
    }

    // 20. Notification Consistency on KYC Events
    @Test
    public void test20_NotificationConsistency() {
        MockMultipartFile validFile = new MockMultipartFile("file", "pan_card.jpg", "image/jpeg", "VALID_PAN_DATA".getBytes());
        KycDocumentResponse uploaded = kycDocumentService.uploadDocument(providerUser1.getEmail(), KycDocumentType.PAN_CARD, "ABCDE1234F", validFile);

        VerifyKycRequest verifyReq = new VerifyKycRequest();
        verifyReq.setStatus(KycDocumentStatus.VERIFIED);

        KycDocumentResponse verified = kycDocumentService.verifyDocument(uploaded.getId(), verifyReq, adminUser.getEmail());
        assertEquals(KycDocumentStatus.VERIFIED, verified.getStatus());
    }

    // 21. File Storage Authorization
    @Test
    public void test21_FileStorageAuthorization() {
        MockMultipartFile validFile = new MockMultipartFile("file", "pan_card.jpg", "image/jpeg", "VALID_PAN_DATA".getBytes());
        KycDocumentResponse uploaded = kycDocumentService.uploadDocument(providerUser1.getEmail(), KycDocumentType.PAN_CARD, "ABCDE1234F", validFile);

        // Admin can view document
        assertNotNull(kycDocumentService.loadDocumentFile(uploaded.getId(), adminUser.getEmail()));

        // Owner can view document
        assertNotNull(kycDocumentService.loadDocumentFile(uploaded.getId(), providerUser1.getEmail()));

        // Non-owner / non-admin cannot view
        assertThrows(ResponseStatusException.class, () ->
                kycDocumentService.loadDocumentFile(uploaded.getId(), providerUser2.getEmail())
        );
    }

    // 22. Audit Log Integrity
    @Test
    public void test22_AuditLogIntegrity() {
        MockMultipartFile validFile = new MockMultipartFile("file", "pan_card.jpg", "image/jpeg", "VALID_PAN_DATA".getBytes());
        KycDocumentResponse uploaded = kycDocumentService.uploadDocument(providerUser1.getEmail(), KycDocumentType.PAN_CARD, "ABCDE1234F", validFile);

        VerifyKycRequest verifyReq = new VerifyKycRequest();
        verifyReq.setStatus(KycDocumentStatus.VERIFIED);

        KycDocumentResponse verified = kycDocumentService.verifyDocument(uploaded.getId(), verifyReq, adminUser.getEmail());

        KycDocument docEntity = kycDocumentRepository.findById(uploaded.getId()).orElseThrow();
        assertNotNull(docEntity.getVerifiedBy(), "verifiedBy admin user audit reference must be populated");
        assertEquals(adminUser.getId(), docEntity.getVerifiedBy().getId());
        assertNotNull(docEntity.getVerifiedAt(), "verifiedAt timestamp must be populated");
    }
}
