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
    void testOptimisticLockVersionIncrementOnBooking() {
        Booking booking = createTestBooking(BookingStatus.PENDING);
        Long initialVersion = booking.getVersion();
        assertNotNull(initialVersion);

        booking.transitionToStatus(BookingStatus.ASSIGNED);
        Booking saved = bookingRepository.saveAndFlush(booking);

        assertNotNull(saved.getVersion());
        assertTrue(saved.getVersion() >= initialVersion);
    }

    private Booking createTestBooking(BookingStatus initialStatus) {
        User user = new User();
        user.setName("Concurrency Test User");
        user.setEmail("conc_user_" + UUID.randomUUID() + "@example.com");
        user.setPassword("Password123!");
        user.setPhone("98765432" + (int)(Math.random()*90 + 10));
        user.setRole(Role.USER);
        user.setCity("Indore");
        user.setPincode("452001");
        user.setEmailVerified(true);
        user.setPhoneVerified(true);
        user = userRepository.save(user);

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
