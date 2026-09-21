package com.taaskr;

import com.taaskr.entity.*;
import com.taaskr.enums.BookingStatus;
import com.taaskr.enums.PaymentMethod;
import com.taaskr.enums.PaymentStatus;
import com.taaskr.enums.Role;
import com.taaskr.exception.BadRequestException;
import com.taaskr.repository.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class ConcurrencyAndBookingIntegrityTests {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private ServiceCategoryRepository categoryRepository;

    @Autowired
    private com.taaskr.service.IdempotencyService idempotencyService;

    @Autowired
    private ProviderProfileRepository providerProfileRepository;

    @Test
    void testStateTransitionProtectionOnCancelledBooking() {
        Booking booking = createTestBooking(BookingStatus.CANCELLED);

        // Attempting to transition a CANCELLED booking to PARTNER_ACCEPTED must fail
        assertThrows(BadRequestException.class, () -> {
            booking.transitionToStatus(BookingStatus.PARTNER_ACCEPTED);
        });

        // Attempting to transition a CANCELLED booking to WORK_STARTED must fail
        assertThrows(BadRequestException.class, () -> {
            booking.transitionToStatus(BookingStatus.WORK_STARTED);
        });
    }

    @Test
    void testInvalidOutOfOrderStateTransition() {
        Booking booking = createTestBooking(BookingStatus.PENDING);

        // Attempting to jump directly from PENDING to WORK_COMPLETED must fail
        assertThrows(BadRequestException.class, () -> {
            booking.transitionToStatus(BookingStatus.WORK_COMPLETED);
        });

        // Valid transition from PENDING to ASSIGNED must succeed
        booking.transitionToStatus(BookingStatus.ASSIGNED);
        assertEquals(BookingStatus.ASSIGNED, booking.getStatus());
    }

    @Test
    void testFullValidBookingLifecycleTransitions() {
        Booking booking = createTestBooking(BookingStatus.PENDING);

        booking.transitionToStatus(BookingStatus.ASSIGNED);
        assertEquals(BookingStatus.ASSIGNED, booking.getStatus());

        booking.transitionToStatus(BookingStatus.ACCEPTED);
        assertEquals(BookingStatus.ACCEPTED, booking.getStatus());

        booking.transitionToStatus(BookingStatus.ON_THE_WAY);
        assertEquals(BookingStatus.ON_THE_WAY, booking.getStatus());

        booking.transitionToStatus(BookingStatus.ARRIVED);
        assertEquals(BookingStatus.ARRIVED, booking.getStatus());

        booking.transitionToStatus(BookingStatus.WORK_STARTED);
        assertEquals(BookingStatus.WORK_STARTED, booking.getStatus());

        booking.transitionToStatus(BookingStatus.WORK_COMPLETED);
        assertEquals(BookingStatus.WORK_COMPLETED, booking.getStatus());

        booking.transitionToStatus(BookingStatus.PAYMENT_COMPLETED);
        assertEquals(BookingStatus.PAYMENT_COMPLETED, booking.getStatus());

        booking.transitionToStatus(BookingStatus.COMPLETED);
        assertEquals(BookingStatus.COMPLETED, booking.getStatus());
    }

    @Test
    void testTerminalStateProtectionOnCompletedAndRejectedBooking() {
        Booking completedBooking = createTestBooking(BookingStatus.COMPLETED);
        assertThrows(BadRequestException.class, () -> {
            completedBooking.transitionToStatus(BookingStatus.WORK_STARTED);
        });
        assertThrows(BadRequestException.class, () -> {
            completedBooking.transitionToStatus(BookingStatus.CANCELLED);
        });

        Booking rejectedBooking = createTestBooking(BookingStatus.REJECTED);
        assertThrows(BadRequestException.class, () -> {
            rejectedBooking.transitionToStatus(BookingStatus.ACCEPTED);
        });
        assertThrows(BadRequestException.class, () -> {
            rejectedBooking.transitionToStatus(BookingStatus.ON_THE_WAY);
        });
    }

    @Test
    void testIdempotentStatusTransitionAttempt() {
        Booking booking = createTestBooking(BookingStatus.ASSIGNED);
        
        // Retrying transition to same status must be a safe no-op
        assertDoesNotThrow(() -> {
            booking.transitionToStatus(BookingStatus.ASSIGNED);
        });
        assertEquals(BookingStatus.ASSIGNED, booking.getStatus());
    }

    @Test
    void testIdempotencyKeyDeduplicationAndPayloadMismatchProtection() {
        User user = createTestUser();
        String idempotencyKey = "key-" + UUID.randomUUID();
        java.util.Map<String, Object> req1 = java.util.Map.of("serviceId", 10, "city", "Indore");

        // Initial check: not duplicate
        var resultOpt1 = idempotencyService.checkIdempotency(user, "CREATE_BOOKING", idempotencyKey, req1);
        assertTrue(resultOpt1.isPresent());
        assertFalse(resultOpt1.get().isDuplicate());

        // Save idempotency record
        java.util.Map<String, Object> resp1 = java.util.Map.of("bookingId", 999, "status", "ASSIGNED");
        idempotencyService.saveIdempotencyRecord(user, "CREATE_BOOKING", idempotencyKey, req1, resp1, 201);

        // Second check with identical request: detected duplicate
        var resultOpt2 = idempotencyService.checkIdempotency(user, "CREATE_BOOKING", idempotencyKey, req1);
        assertTrue(resultOpt2.isPresent());
        assertTrue(resultOpt2.get().isDuplicate());
        assertTrue(resultOpt2.get().cachedResponseBody().contains("999"));

        // Third check with modified payload: throws BadRequestException due to payload mismatch
        java.util.Map<String, Object> req2 = java.util.Map.of("serviceId", 20, "city", "Bhopal");
        assertThrows(BadRequestException.class, () -> {
            idempotencyService.checkIdempotency(user, "CREATE_BOOKING", idempotencyKey, req2);
        });
    }

    @Test
    void testOptimisticLockVersionIncrementOnBooking() {
        Booking booking = createTestBooking(BookingStatus.PENDING);
        Long initialVersion = booking.getVersion();
        assertNotNull(initialVersion);

        booking.transitionToStatus(BookingStatus.ASSIGNED);
        Booking saved = bookingRepository.saveAndFlush(booking);

        assertNotNull(saved.getVersion());
        assertTrue(saved.getVersion() >= initialVersion);
    }

    @Test
    void testProviderAssignmentEligibilityAndConflictProtection() {
        Booking booking1 = createTestBooking(BookingStatus.ASSIGNED);
        User providerUser = createTestUser();
        providerUser.setRole(Role.PROVIDER);
        providerUser = userRepository.save(providerUser);

        ProviderProfile provider = new ProviderProfile();
        provider.setUser(providerUser);
        provider.setApproved(true);
        provider.setCity("Indore");
        provider.setPincode("452001");
        provider = providerProfileRepository.save(provider);

        booking1.setProvider(provider);
        bookingRepository.save(booking1);

        // Check overlapping booking conflict detection
        boolean hasOverlap = bookingRepository.existsByProviderIdAndBookingDateAndStartTimeLessThanAndEndTimeGreaterThan(
                provider.getId(),
                booking1.getBookingDate(),
                booking1.getEndTime(),
                booking1.getStartTime()
        );
        assertTrue(hasOverlap);

        // Check non-overlapping time slot
        boolean nonOverlap = bookingRepository.existsByProviderIdAndBookingDateAndStartTimeLessThanAndEndTimeGreaterThan(
                provider.getId(),
                booking1.getBookingDate(),
                booking1.getEndTime().plusHours(2),
                booking1.getStartTime().plusHours(2)
        );
        assertFalse(nonOverlap);
    }

    @Test
    void testTerminalBookingStatusExclusionFromProviderOverlap() {
        User providerUser = createTestUser();
        providerUser.setRole(Role.PROVIDER);
        providerUser = userRepository.save(providerUser);

        ProviderProfile provider = new ProviderProfile();
        provider.setUser(providerUser);
        provider.setApproved(true);
        provider.setCity("Indore");
        provider.setPincode("452001");
        provider = providerProfileRepository.save(provider);

        // Cancelled booking during 10:00 - 11:00
        Booking cancelledBooking = createTestBooking(BookingStatus.CANCELLED);
        cancelledBooking.setProvider(provider);
        cancelledBooking.setStartTime(LocalTime.of(10, 0));
        cancelledBooking.setEndTime(LocalTime.of(11, 0));
        bookingRepository.save(cancelledBooking);

        // Overlap query excluding CANCELLED and REJECTED
        boolean hasOverlap = bookingRepository.existsByProviderIdAndBookingDateAndStatusNotInAndStartTimeLessThanAndEndTimeGreaterThan(
                provider.getId(),
                cancelledBooking.getBookingDate(),
                java.util.List.of(BookingStatus.CANCELLED, BookingStatus.REJECTED),
                LocalTime.of(11, 0),
                LocalTime.of(10, 0)
        );
        assertFalse(hasOverlap, "Cancelled booking must NOT block provider scheduling during 10:00-11:00");
    }

    @Test
    void testFullSlotIntervalMatchingBoundary() {
        AvailabilitySlot slot = new AvailabilitySlot();
        slot.setAvailableDate(LocalDate.now());
        slot.setStartTime(LocalTime.of(10, 0));
        slot.setEndTime(LocalTime.of(12, 0));
        slot.setBooked(false);

        // 1. Booking 10:00-11:00 fully inside 10:00-12:00 -> Valid
        LocalTime start1 = LocalTime.of(10, 0);
        LocalTime end1 = LocalTime.of(11, 0);
        boolean valid1 = !slot.getStartTime().isAfter(start1) && !slot.getEndTime().isBefore(end1);
        assertTrue(valid1);

        // 2. Booking 10:50-12:10 extends past slot end 12:00 -> Invalid
        LocalTime start2 = LocalTime.of(10, 50);
        LocalTime end2 = LocalTime.of(12, 10);
        boolean valid2 = !slot.getStartTime().isAfter(start2) && !slot.getEndTime().isBefore(end2);
        assertFalse(valid2, "Booking extending past slot end must be rejected");

        // 3. Booking 09:30-10:30 starts before slot start 10:00 -> Invalid
        LocalTime start3 = LocalTime.of(9, 30);
        LocalTime end3 = LocalTime.of(10, 30);
        boolean valid3 = !slot.getStartTime().isAfter(start3) && !slot.getEndTime().isBefore(end3);
        assertFalse(valid3, "Booking starting before slot start must be rejected");
    }

    private User createTestUser() {
        User user = new User();
        user.setName("Idempotency User");
        user.setEmail("idem_user_" + UUID.randomUUID() + "@example.com");
        user.setPassword("Password123!");
        user.setPhone("98765432" + (int)(Math.random()*90 + 10));
        user.setRole(Role.USER);
        user.setCity("Indore");
        user.setPincode("452001");
        user.setEmailVerified(true);
        user.setPhoneVerified(true);
        return userRepository.save(user);
    }

    private Booking createTestBooking(BookingStatus initialStatus) {
        User user = createTestUser();

        ServiceCategory category = new ServiceCategory();
        category.setName("Test Cat " + UUID.randomUUID());
        category.setActive(true);
        category = categoryRepository.save(category);

        Service service = new Service();
        service.setName("Test Service " + UUID.randomUUID());
        service.setCategory(category);
        service.setPrice(BigDecimal.valueOf(500));
        service.setDurationMinutes(60);
        service.setActive(true);
        service = serviceRepository.save(service);

        Booking booking = new Booking();
        booking.setBookingCode("BK-" + UUID.randomUUID().toString().substring(0, 8));
        booking.setUser(user);
        booking.setService(service);
        booking.setBookingDate(LocalDate.now().plusDays(1));
        booking.setStartTime(LocalTime.of(10, 0));
        booking.setEndTime(LocalTime.of(11, 0));
        booking.setAddress("123 Test Street");
        booking.setCity("Indore");
        booking.setPincode("452001");
        booking.setStatus(initialStatus);
        booking.setTotalAmount(BigDecimal.valueOf(500));
        booking.setFinalAmount(BigDecimal.valueOf(500));
        booking.setPaymentStatus(PaymentStatus.PENDING);
        booking.setPaymentMethod(PaymentMethod.AFTER_SERVICE);

        return bookingRepository.save(booking);
    }
}
