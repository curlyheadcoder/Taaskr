package com.taaskr;

import com.taaskr.dto.admin.analytics.AdminAnalyticsResponse;
import com.taaskr.entity.*;
import com.taaskr.enums.BookingStatus;
import com.taaskr.enums.PaymentStatus;
import com.taaskr.enums.Role;
import com.taaskr.repository.*;
import com.taaskr.service.AdminAnalyticsService;
import com.taaskr.service.AppMetricsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class AdminAnalyticsAndObservabilityTests {

    @Autowired
    private AdminAnalyticsService adminAnalyticsService;

    @Autowired
    private AppMetricsService appMetricsService;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ServiceCategoryRepository categoryRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    private ServiceCategory testCategory;
    private Service testService;
    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setName("Analytics Test User");
        testUser.setEmail("analytics_" + UUID.randomUUID() + "@test.com");
        testUser.setPhone("9876543210");
        testUser.setCity("Bengaluru");
        testUser.setPincode("560001");
        testUser.setPassword("password123");
        testUser.setRole(Role.USER);
        testUser = userRepository.save(testUser);

        testCategory = new ServiceCategory();
        testCategory.setName("Analytics Category " + UUID.randomUUID());
        testCategory.setDescription("Test Category Description");
        testCategory = categoryRepository.save(testCategory);

        testService = new Service();
        testService.setName("Analytics Service");
        testService.setDescription("Service for analytics test");
        testService.setPrice(BigDecimal.valueOf(1500));
        testService.setDurationMinutes(60);
        testService.setCategory(testCategory);
        testService.setActive(true);
        testService = serviceRepository.save(testService);
    }

    @Test
    void testAnalyticsAggregation() {
        // Create 2 test bookings
        Booking booking1 = new Booking();
        booking1.setBookingCode("BK-" + UUID.randomUUID().toString().substring(0, 8));
        booking1.setUser(testUser);
        booking1.setService(testService);
        booking1.setBookingDate(LocalDate.now());
        booking1.setStartTime(LocalTime.of(10, 0));
        booking1.setEndTime(LocalTime.of(11, 0));
        booking1.setAddress("123 MG Road");
        booking1.setCity("Bengaluru");
        booking1.setPincode("560001");
        booking1.setStatus(BookingStatus.COMPLETED);
        booking1.setPaymentStatus(PaymentStatus.PAID);
        booking1.setTotalAmount(BigDecimal.valueOf(1500));
        booking1.setFinalAmount(BigDecimal.valueOf(1500));
        bookingRepository.save(booking1);

        Booking booking2 = new Booking();
        booking2.setBookingCode("BK-" + UUID.randomUUID().toString().substring(0, 8));
        booking2.setUser(testUser);
        booking2.setService(testService);
        booking2.setBookingDate(LocalDate.now());
        booking2.setStartTime(LocalTime.of(14, 0));
        booking2.setEndTime(LocalTime.of(15, 0));
        booking2.setAddress("456 Indiranagar");
        booking2.setCity("Bengaluru");
        booking2.setPincode("560038");
        booking2.setStatus(BookingStatus.PENDING);
        booking2.setPaymentStatus(PaymentStatus.PENDING);
        booking2.setTotalAmount(BigDecimal.valueOf(1500));
        booking2.setFinalAmount(BigDecimal.valueOf(1500));
        bookingRepository.save(booking2);

        AdminAnalyticsResponse response = adminAnalyticsService.getPlatformAnalytics(30);

        assertNotNull(response);
        assertNotNull(response.getKpiSummary());
        assertTrue(response.getKpiSummary().getTotalBookings() >= 2);
        assertTrue(response.getKpiSummary().getCompletedBookings() >= 1);
        assertTrue(response.getKpiSummary().getTotalRevenue().compareTo(BigDecimal.valueOf(1500)) >= 0);

        // Telemetry check
        assertNotNull(response.getTelemetry());
        assertEquals("HEALTHY", response.getTelemetry().getStatus());
        assertTrue(response.getTelemetry().getHeapMaxMb() > 0);

        // Trends check
        assertNotNull(response.getRevenueTrends());
        assertEquals(30, response.getRevenueTrends().size());

        // Category distribution check
        assertNotNull(response.getCategoryDistribution());
        assertTrue(response.getCategoryDistribution().stream()
                .anyMatch(c -> c.getCategoryName().equals(testCategory.getName())));
    }

    @Test
    void testAppMetricsRecording() {
        assertDoesNotThrow(() -> {
            appMetricsService.recordBookingCreated("Plumbing", "Pipe Repair");
            appMetricsService.recordBookingStatusChanged("PENDING", "ASSIGNED");
            appMetricsService.recordPayment("SUCCESS", 1200.0);
            appMetricsService.recordAiDiagnostic(true, Duration.ofMillis(450));
        });
    }
}
