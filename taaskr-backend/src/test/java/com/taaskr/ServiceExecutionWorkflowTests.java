package com.taaskr;

import com.taaskr.dto.booking.BookingResponse;
import com.taaskr.dto.provider.ProviderBookingResponse;
import com.taaskr.dto.provider.UpdateProviderBookingStatusRequest;
import com.taaskr.entity.*;
import com.taaskr.enums.BookingStatus;
import com.taaskr.enums.Role;
import com.taaskr.exception.BadRequestException;
import com.taaskr.repository.*;
import com.taaskr.service.ProviderWorkflowService;
import com.taaskr.service.ServicePartnerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
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
public class ServiceExecutionWorkflowTests {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProviderProfileRepository providerProfileRepository;

    @Autowired
    private ServicePartnerRepository servicePartnerRepository;

    @Autowired
    private ServiceCategoryRepository categoryRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private ProviderWorkflowService providerWorkflowService;

    @Autowired
    private ServicePartnerService servicePartnerService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User customerUser;
    private User providerUser;
    private ProviderProfile providerProfile;
    private User partnerUser;
    private ServicePartner servicePartner;
    private Service testService;

    @BeforeEach
    void setUp() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);

        // Customer User
        customerUser = new User();
        customerUser.setName("Test Customer " + suffix);
        customerUser.setEmail("cust." + suffix + "@test.com");
        customerUser.setPhone("98" + suffix.replaceAll("[^0-9]", "1").substring(0, 8));
        customerUser.setPassword(passwordEncoder.encode("password"));
        customerUser.setRole(Role.USER);
        customerUser.setCity("Indore");
        customerUser.setPincode("452001");
        customerUser.setEmailVerified(true);
        customerUser.setPhoneVerified(true);
        customerUser = userRepository.save(customerUser);

        // Provider User & Profile
        providerUser = new User();
        providerUser.setName("Test Provider " + suffix);
        providerUser.setEmail("prov." + suffix + "@test.com");
        providerUser.setPhone("99" + suffix.replaceAll("[^0-9]", "2").substring(0, 8));
        providerUser.setPassword(passwordEncoder.encode("password"));
        providerUser.setRole(Role.PROVIDER);
        providerUser.setCity("Indore");
        providerUser.setPincode("452001");
        providerUser.setEmailVerified(true);
        providerUser.setPhoneVerified(true);
        providerUser = userRepository.save(providerUser);

        providerProfile = new ProviderProfile();
        providerProfile.setUser(providerUser);
        providerProfile.setExperienceYears(5);
        providerProfile.setCity("Indore");
        providerProfile.setPincode("452001");
        providerProfile.setApproved(true);
        providerProfile.setIsOnline(true);
        providerProfile = providerProfileRepository.save(providerProfile);

        // Partner User & ServicePartner
        partnerUser = new User();
        partnerUser.setName("Test Field Partner " + suffix);
        partnerUser.setEmail("partner." + suffix + "@test.com");
        partnerUser.setPhone("97" + suffix.replaceAll("[^0-9]", "3").substring(0, 8));
        partnerUser.setPassword(passwordEncoder.encode("password"));
        partnerUser.setRole(Role.SERVICE_PARTNER);
        partnerUser.setCity("Indore");
        partnerUser.setPincode("452001");
        partnerUser.setEmailVerified(true);
        partnerUser.setPhoneVerified(true);
        partnerUser = userRepository.save(partnerUser);

        servicePartner = new ServicePartner();
        servicePartner.setProvider(providerProfile);
        servicePartner.setUser(partnerUser);
        servicePartner.setName("Test Field Partner " + suffix);
        servicePartner.setPhone(partnerUser.getPhone());
        servicePartner.setEmail(partnerUser.getEmail());
        servicePartner.setTitle("Senior Technician");
        servicePartner.setActive(true);
        servicePartner = servicePartnerRepository.save(servicePartner);

        // Category & Service
        ServiceCategory category = new ServiceCategory();
        category.setName("Plumbing " + suffix);
        category.setDescription("Test plumbing category");
        category.setActive(true);
        category = categoryRepository.save(category);

        testService = new Service();
        testService.setName("Tap Repair " + suffix);
        testService.setDescription("Fix leaking taps");
        testService.setPrice(BigDecimal.valueOf(499));
        testService.setDurationMinutes(60);
        testService.setCategory(category);
        testService.setActive(true);
        testService = serviceRepository.save(testService);
    }

    private Booking createBooking(ProviderProfile provider, ServicePartner partner, BookingStatus initialStatus) {
        Booking booking = new Booking();
        booking.setBookingCode("TSK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        booking.setUser(customerUser);
        booking.setService(testService);
        booking.setProvider(provider);
        booking.setServicePartner(partner);
        booking.setBookingDate(LocalDate.now());
        booking.setStartTime(LocalTime.of(9, 0));
        booking.setEndTime(LocalTime.of(10, 0));
        booking.setAddress("123 Test St");
        booking.setCity("Indore");
        booking.setPincode("452001");
        booking.setTotalAmount(BigDecimal.valueOf(499));
        booking.setDiscountAmount(BigDecimal.ZERO);
        booking.setFinalAmount(BigDecimal.valueOf(499));
        booking.setStatus(initialStatus);
        return bookingRepository.save(booking);
    }

    @Test
    void testServicePartnerPrecedenceOverProviderWorkStart() {
        // Create booking with both Provider AND ServicePartner assigned
        Booking booking = createBooking(providerProfile, servicePartner, BookingStatus.PARTNER_ASSIGNED);

        // Attempting to start work as the Provider must FAIL because a Service Partner is assigned
        UpdateProviderBookingStatusRequest request = new UpdateProviderBookingStatusRequest();
        request.setStatus(BookingStatus.WORK_STARTED);

        BadRequestException ex = assertThrows(BadRequestException.class, () -> {
            providerWorkflowService.updateBookingStatus(providerUser.getEmail(), booking.getId(), request);
        });
        assertTrue(ex.getMessage().contains("Service Partner"), "Error should explain that Service Partner is assigned");

        // Starting work as the assigned Service Partner must SUCCEED
        BookingResponse partnerResponse = servicePartnerService.startWorkByPartner(partnerUser.getEmail(), booking.getId());
        assertNotNull(partnerResponse);
        assertEquals(BookingStatus.WORK_STARTED, partnerResponse.getStatus());
        assertNotNull(partnerResponse.getWorkStartedAt(), "workStartedAt timestamp must be persisted");
    }

    @Test
    void testDirectProviderWorkStartWhenNoServicePartnerAssigned() {
        // Create booking with Provider assigned but NO ServicePartner assigned
        Booking booking = createBooking(providerProfile, null, BookingStatus.ACCEPTED);

        // Provider starts work
        UpdateProviderBookingStatusRequest request = new UpdateProviderBookingStatusRequest();
        request.setStatus(BookingStatus.WORK_STARTED);

        ProviderBookingResponse response = providerWorkflowService.updateBookingStatus(providerUser.getEmail(), booking.getId(), request);
        assertNotNull(response);
        assertEquals(BookingStatus.WORK_STARTED, response.getStatus());
        assertNotNull(response.getWorkStartedAt(), "workStartedAt timestamp must be persisted for direct provider start");
        assertEquals(providerProfile.getId(), response.getProviderId());
    }

    @Test
    void testUnassignedBookingWorkStartRejection() {
        // Create unassigned booking (no provider, no partner)
        Booking booking = createBooking(null, null, BookingStatus.PENDING);

        // Attempt to start work must fail
        UpdateProviderBookingStatusRequest request = new UpdateProviderBookingStatusRequest();
        request.setStatus(BookingStatus.WORK_STARTED);

        assertThrows(Exception.class, () -> {
            providerWorkflowService.updateBookingStatus(providerUser.getEmail(), booking.getId(), request);
        });
    }

    @Test
    void testTerminalStateProtectionOnCompletedBooking() {
        Booking booking = createBooking(providerProfile, servicePartner, BookingStatus.COMPLETED);

        UpdateProviderBookingStatusRequest request = new UpdateProviderBookingStatusRequest();
        request.setStatus(BookingStatus.WORK_STARTED);

        assertThrows(BadRequestException.class, () -> {
            providerWorkflowService.updateBookingStatus(providerUser.getEmail(), booking.getId(), request);
        });
    }

    @Test
    void testDirectProviderMarkCompletedFromInTransit() {
        Booking booking = createBooking(providerProfile, null, BookingStatus.IN_TRANSIT);

        UpdateProviderBookingStatusRequest request = new UpdateProviderBookingStatusRequest();
        request.setStatus(BookingStatus.COMPLETED);

        ProviderBookingResponse response = providerWorkflowService.updateBookingStatus(providerUser.getEmail(), booking.getId(), request);
        assertNotNull(response);
        assertEquals(BookingStatus.COMPLETED, response.getStatus());
        assertNotNull(response.getWorkCompletedAt(), "workCompletedAt timestamp must be set when marked completed from IN_TRANSIT");
    }
}
