package com.taaskr;

import com.taaskr.dto.partner.UpdatePartnerLocationRequest;
import com.taaskr.entity.*;
import com.taaskr.enums.BookingStatus;
import com.taaskr.enums.PaymentMethod;
import com.taaskr.enums.PaymentStatus;
import com.taaskr.enums.Role;
import com.taaskr.exception.BadRequestException;
import com.taaskr.repository.*;
import com.taaskr.service.ServicePartnerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class GpsTrackingIntegrityTests {

    @Autowired
    private ServicePartnerService servicePartnerService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProviderProfileRepository providerProfileRepository;

    @Autowired
    private ServicePartnerRepository servicePartnerRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private ServiceCategoryRepository categoryRepository;

    private User partnerUser;
    private User otherPartnerUser;
    private User customerUser;
    private ProviderProfile providerProfile;
    private ServicePartner partner;
    private ServicePartner otherPartner;
    private Booking booking;

    @BeforeEach
    void setUp() {
        bookingRepository.deleteAll();
        servicePartnerRepository.deleteAll();
        providerProfileRepository.deleteAll();
        userRepository.deleteAll();
        serviceRepository.deleteAll();
        categoryRepository.deleteAll();

        customerUser = createUser("gps_cust_" + UUID.randomUUID() + "@example.com", Role.USER);
        partnerUser = createUser("gps_partner_" + UUID.randomUUID() + "@example.com", Role.PROVIDER);
        otherPartnerUser = createUser("gps_other_partner_" + UUID.randomUUID() + "@example.com", Role.PROVIDER);

        providerProfile = createProviderProfile(partnerUser);
        partner = createServicePartner(partnerUser, providerProfile);
        otherPartner = createServicePartner(otherPartnerUser, providerProfile);

        booking = createBooking(customerUser, providerProfile, partner, BookingStatus.ON_THE_WAY);
    }

    @Test
    void testActiveOnTheWayPartnerCanUpdateLocation() {
        UpdatePartnerLocationRequest req = new UpdatePartnerLocationRequest();
        req.setLatitude(BigDecimal.valueOf(22.7500));
        req.setLongitude(BigDecimal.valueOf(75.8800));
        req.setTimestamp(System.currentTimeMillis());

        assertDoesNotThrow(() -> {
            servicePartnerService.updatePartnerLocation(partnerUser.getEmail(), req);
        });

        ServicePartner updated = servicePartnerRepository.findById(partner.getId()).orElseThrow();
        assertEquals(0, BigDecimal.valueOf(22.7500).compareTo(updated.getCurrentLatitude()));
        assertEquals(0, BigDecimal.valueOf(75.8800).compareTo(updated.getCurrentLongitude()));
        assertNotNull(updated.getLocationUpdatedAt());
    }

    @Test
    void testPartnerWithNoActiveBookingCannotUpdateLocation() {
        UpdatePartnerLocationRequest req = new UpdatePartnerLocationRequest();
        req.setLatitude(BigDecimal.valueOf(22.7500));
        req.setLongitude(BigDecimal.valueOf(75.8800));
        req.setTimestamp(System.currentTimeMillis());

        // otherPartner has no active ON_THE_WAY booking
        assertThrows(BadRequestException.class, () -> {
            servicePartnerService.updatePartnerLocation(otherPartnerUser.getEmail(), req);
        });
    }

    @Test
    void testPartnerWithArrivedBookingCannotContinueUpdatingLocation() {
        booking.transitionToStatus(BookingStatus.ARRIVED);
        bookingRepository.save(booking);

        UpdatePartnerLocationRequest req = new UpdatePartnerLocationRequest();
        req.setLatitude(BigDecimal.valueOf(22.7500));
        req.setLongitude(BigDecimal.valueOf(75.8800));
        req.setTimestamp(System.currentTimeMillis());

        assertThrows(BadRequestException.class, () -> {
            servicePartnerService.updatePartnerLocation(partnerUser.getEmail(), req);
        });
    }

    @Test
    void testMissingOrFutureTimestampRejected() {
        UpdatePartnerLocationRequest noTsReq = new UpdatePartnerLocationRequest();
        noTsReq.setLatitude(BigDecimal.valueOf(22.7500));
        noTsReq.setLongitude(BigDecimal.valueOf(75.8800));
        noTsReq.setTimestamp(null);

        assertThrows(BadRequestException.class, () -> {
            servicePartnerService.updatePartnerLocation(partnerUser.getEmail(), noTsReq);
        });

        UpdatePartnerLocationRequest futureReq = new UpdatePartnerLocationRequest();
        futureReq.setLatitude(BigDecimal.valueOf(22.7500));
        futureReq.setLongitude(BigDecimal.valueOf(75.8800));
        futureReq.setTimestamp(System.currentTimeMillis() + 120_000L); // 2 minutes in future

        assertThrows(BadRequestException.class, () -> {
            servicePartnerService.updatePartnerLocation(partnerUser.getEmail(), futureReq);
        });
    }

    @Test
    void testStaleOutOfOrderLocationIsIgnored() {
        // 1. Packet A captured at timestamp 1000L
        UpdatePartnerLocationRequest packetA = new UpdatePartnerLocationRequest();
        packetA.setLatitude(BigDecimal.valueOf(22.7500));
        packetA.setLongitude(BigDecimal.valueOf(75.8800));
        packetA.setTimestamp(1000000L);
        servicePartnerService.updatePartnerLocation(partnerUser.getEmail(), packetA);

        ServicePartner afterA = servicePartnerRepository.findById(partner.getId()).orElseThrow();
        assertEquals(0, BigDecimal.valueOf(22.7500).compareTo(afterA.getCurrentLatitude()));
        assertEquals(0, BigDecimal.valueOf(75.8800).compareTo(afterA.getCurrentLongitude()));

        // 2. Packet B captured later at timestamp 2000L (arrives and accepted)
        UpdatePartnerLocationRequest packetB = new UpdatePartnerLocationRequest();
        packetB.setLatitude(BigDecimal.valueOf(22.7600));
        packetB.setLongitude(BigDecimal.valueOf(75.8900));
        packetB.setTimestamp(2000000L);
        servicePartnerService.updatePartnerLocation(partnerUser.getEmail(), packetB);

        ServicePartner afterB = servicePartnerRepository.findById(partner.getId()).orElseThrow();
        assertEquals(0, BigDecimal.valueOf(22.7600).compareTo(afterB.getCurrentLatitude()));
        assertEquals(0, BigDecimal.valueOf(75.8900).compareTo(afterB.getCurrentLongitude()));

        // 3. Packet C captured earlier at timestamp 1500L (arrives late out-of-order)
        UpdatePartnerLocationRequest packetC = new UpdatePartnerLocationRequest();
        packetC.setLatitude(BigDecimal.valueOf(22.1111));
        packetC.setLongitude(BigDecimal.valueOf(75.1111));
        packetC.setTimestamp(1500000L);
        servicePartnerService.updatePartnerLocation(partnerUser.getEmail(), packetC);

        // Stored coordinates & timestamp MUST remain Packet B coordinates (22.7600, 75.8900) & timestamp 2000000L
        ServicePartner afterStaleC = servicePartnerRepository.findById(partner.getId()).orElseThrow();
        assertEquals(0, BigDecimal.valueOf(22.7600).compareTo(afterStaleC.getCurrentLatitude()));
        assertEquals(0, BigDecimal.valueOf(75.8900).compareTo(afterStaleC.getCurrentLongitude()));
        long storedMillis = afterStaleC.getLocationUpdatedAt().atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli();
        assertEquals(2000000L, storedMillis);
    }

    @Test
    void testEqualTimestampLocationIsIgnored() {
        UpdatePartnerLocationRequest packetB = new UpdatePartnerLocationRequest();
        packetB.setLatitude(BigDecimal.valueOf(22.7600));
        packetB.setLongitude(BigDecimal.valueOf(75.8900));
        packetB.setTimestamp(2000000L);
        servicePartnerService.updatePartnerLocation(partnerUser.getEmail(), packetB);

        // Duplicate telemetry with exact same timestamp = 2000000L
        UpdatePartnerLocationRequest duplicatePacket = new UpdatePartnerLocationRequest();
        duplicatePacket.setLatitude(BigDecimal.valueOf(22.3333));
        duplicatePacket.setLongitude(BigDecimal.valueOf(75.3333));
        duplicatePacket.setTimestamp(2000000L);
        servicePartnerService.updatePartnerLocation(partnerUser.getEmail(), duplicatePacket);

        ServicePartner result = servicePartnerRepository.findById(partner.getId()).orElseThrow();
        assertEquals(0, BigDecimal.valueOf(22.7600).compareTo(result.getCurrentLatitude()));
        assertEquals(0, BigDecimal.valueOf(75.8900).compareTo(result.getCurrentLongitude()));
    }

    @Test
    void testPartnerCannotUpdateAnotherPartnerLocationByPayload() {
        UpdatePartnerLocationRequest req = new UpdatePartnerLocationRequest();
        req.setLatitude(BigDecimal.valueOf(22.7500));
        req.setLongitude(BigDecimal.valueOf(75.8800));
        req.setTimestamp(System.currentTimeMillis());

        // updating using partnerUser's authenticated email updates ONLY partnerUser's profile
        servicePartnerService.updatePartnerLocation(partnerUser.getEmail(), req);

        ServicePartner other = servicePartnerRepository.findById(otherPartner.getId()).orElseThrow();
        assertNull(other.getCurrentLatitude());
        assertNull(other.getCurrentLongitude());
    }

    @Autowired
    private jakarta.persistence.EntityManager entityManager;

    @Test
    void testGeofenceWithin200mAutoTriggersArrived() {
        // Customer location: 22.7196, 75.8577
        // Partner location very close (< 50 meters): 22.7198, 75.8578
        UpdatePartnerLocationRequest req = new UpdatePartnerLocationRequest();
        req.setLatitude(BigDecimal.valueOf(22.7198));
        req.setLongitude(BigDecimal.valueOf(75.8578));
        req.setTimestamp(System.currentTimeMillis());

        servicePartnerService.updatePartnerLocation(partnerUser.getEmail(), req);
        entityManager.clear();

        Booking updatedBooking = bookingRepository.findById(booking.getId()).orElseThrow();
        assertEquals(BookingStatus.ARRIVED, updatedBooking.getStatus());
        assertNotNull(updatedBooking.getArrivedAt());
    }

    @Test
    void testGeofenceDoesNotTriggerWhenPhysicalDistanceExceeds200m() {
        // Customer location: 22.7196, 75.8577
        // Partner location ~500m away physically: 22.7240, 75.8577
        UpdatePartnerLocationRequest req = new UpdatePartnerLocationRequest();
        req.setLatitude(BigDecimal.valueOf(22.7240));
        req.setLongitude(BigDecimal.valueOf(75.8577));
        req.setTimestamp(System.currentTimeMillis());

        servicePartnerService.updatePartnerLocation(partnerUser.getEmail(), req);
        entityManager.clear();

        Booking updatedBooking = bookingRepository.findById(booking.getId()).orElseThrow();
        assertEquals(BookingStatus.ON_THE_WAY, updatedBooking.getStatus());
        assertNull(updatedBooking.getArrivedAt());
    }

    @Test
    void testConcurrentTelemetryUpdatesNeverOverwriteNewerLocation() throws Exception {
        // Initial state: location updated at timestamp 1000000L
        UpdatePartnerLocationRequest initialReq = new UpdatePartnerLocationRequest();
        initialReq.setLatitude(BigDecimal.valueOf(22.7400));
        initialReq.setLongitude(BigDecimal.valueOf(75.8700));
        initialReq.setTimestamp(1000000L);
        servicePartnerService.updatePartnerLocation(partnerUser.getEmail(), initialReq);

        int numberOfThreads = 2;
        ExecutorService executor = Executors.newFixedThreadPool(numberOfThreads);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(numberOfThreads);

        long now = System.currentTimeMillis();
        // Request A: timestamp now (newer), coordinates 22.7600, 75.8900
        UpdatePartnerLocationRequest reqA = new UpdatePartnerLocationRequest();
        reqA.setLatitude(BigDecimal.valueOf(22.7600));
        reqA.setLongitude(BigDecimal.valueOf(75.8900));
        reqA.setTimestamp(now);

        // Request B: timestamp now - 5000ms (older), coordinates 22.7500, 75.8800
        UpdatePartnerLocationRequest reqB = new UpdatePartnerLocationRequest();
        reqB.setLatitude(BigDecimal.valueOf(22.7500));
        reqB.setLongitude(BigDecimal.valueOf(75.8800));
        reqB.setTimestamp(now - 5000L);

        executor.submit(() -> {
            try {
                startLatch.await();
                servicePartnerService.updatePartnerLocation(partnerUser.getEmail(), reqA);
            } catch (Exception ignored) {
            } finally {
                doneLatch.countDown();
            }
        });

        executor.submit(() -> {
            try {
                startLatch.await();
                servicePartnerService.updatePartnerLocation(partnerUser.getEmail(), reqB);
            } catch (Exception ignored) {
            } finally {
                doneLatch.countDown();
            }
        });

        startLatch.countDown(); // release both threads simultaneously
        assertTrue(doneLatch.await(10, TimeUnit.SECONDS));
        executor.shutdown();

        entityManager.clear();
        ServicePartner finalPartner = servicePartnerRepository.findById(partner.getId()).orElseThrow();

        // Final persisted state MUST NEVER be Packet B coordinates (22.7500) or Packet B timestamp (1500000L)
        assertNotEquals(0, BigDecimal.valueOf(22.7500).compareTo(finalPartner.getCurrentLatitude()));
        assertEquals(0, BigDecimal.valueOf(22.7600).compareTo(finalPartner.getCurrentLatitude()));
        assertEquals(0, BigDecimal.valueOf(75.8900).compareTo(finalPartner.getCurrentLongitude()));

        long storedMillis = finalPartner.getLocationUpdatedAt().atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli();
        assertEquals(now, storedMillis);
    }

    @Test
    void testConcurrentInOrderTelemetryUpdatesPersistNewerLocation() throws Exception {
        // 1500000L sent first, then 2000000L sent second
        UpdatePartnerLocationRequest req1 = new UpdatePartnerLocationRequest();
        req1.setLatitude(BigDecimal.valueOf(22.7500));
        req1.setLongitude(BigDecimal.valueOf(75.8800));
        req1.setTimestamp(1500000L);
        servicePartnerService.updatePartnerLocation(partnerUser.getEmail(), req1);

        UpdatePartnerLocationRequest req2 = new UpdatePartnerLocationRequest();
        req2.setLatitude(BigDecimal.valueOf(22.7600));
        req2.setLongitude(BigDecimal.valueOf(75.8900));
        req2.setTimestamp(2000000L);
        servicePartnerService.updatePartnerLocation(partnerUser.getEmail(), req2);

        ServicePartner finalPartner = servicePartnerRepository.findById(partner.getId()).orElseThrow();
        assertEquals(0, BigDecimal.valueOf(22.7600).compareTo(finalPartner.getCurrentLatitude()));
        assertEquals(0, BigDecimal.valueOf(75.8900).compareTo(finalPartner.getCurrentLongitude()));

        long storedMillis = finalPartner.getLocationUpdatedAt().atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli();
        assertEquals(2000000L, storedMillis);
    }


    private User createUser(String email, Role role) {
        User user = new User();
        user.setName("GPS User " + role);
        user.setEmail(email);
        user.setPassword("Password123!");
        user.setPhone("9" + (long)(Math.random() * 1000000009L));
        user.setRole(role);
        user.setCity("Indore");
        user.setPincode("452001");
        user.setEmailVerified(true);
        user.setPhoneVerified(true);
        return userRepository.save(user);
    }

    private ProviderProfile createProviderProfile(User user) {
        ProviderProfile profile = new ProviderProfile();
        profile.setUser(user);
        profile.setBio("Bio");
        profile.setExperienceYears(5);
        profile.setRating(4.8);
        profile.setApproved(true);
        return providerProfileRepository.save(profile);
    }

    private ServicePartner createServicePartner(User user, ProviderProfile providerProfile) {
        ServicePartner partner = new ServicePartner();
        partner.setUser(user);
        partner.setProvider(providerProfile);
        partner.setName("Partner " + user.getId());
        partner.setPhone(user.getPhone());
        partner.setRating(4.9);
        partner.setActive(true);
        return servicePartnerRepository.save(partner);
    }

    private Booking createBooking(User customer, ProviderProfile provider, ServicePartner partner, BookingStatus status) {
        ServiceCategory category = new ServiceCategory();
        category.setName("Cat " + UUID.randomUUID());
        category.setActive(true);
        category = categoryRepository.save(category);

        Service service = new Service();
        service.setName("Service " + UUID.randomUUID());
        service.setCategory(category);
        service.setPrice(BigDecimal.valueOf(400));
        service.setDurationMinutes(45);
        service.setActive(true);
        service = serviceRepository.save(service);

        Booking b = new Booking();
        b.setBookingCode("GPS-BK-" + UUID.randomUUID().toString().substring(0, 6));
        b.setUser(customer);
        b.setProvider(provider);
        b.setServicePartner(partner);
        b.setService(service);
        b.setBookingDate(LocalDate.now().plusDays(1));
        b.setStartTime(LocalTime.of(14, 0));
        b.setEndTime(LocalTime.of(15, 0));
        b.setAddress("456 Vijay Nagar");
        b.setCity("Indore");
        b.setPincode("452010");
        b.setLatitude(BigDecimal.valueOf(22.7196));
        b.setLongitude(BigDecimal.valueOf(75.8577));
        b.setStatus(status);
        b.setTotalAmount(BigDecimal.valueOf(400));
        b.setFinalAmount(BigDecimal.valueOf(400));
        b.setPaymentStatus(PaymentStatus.PENDING);
        b.setPaymentMethod(PaymentMethod.AFTER_SERVICE);
        return bookingRepository.save(b);
    }
}
