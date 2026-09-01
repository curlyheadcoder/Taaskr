package com.taaskr;

import com.taaskr.dto.booking.AvailableProviderResponse;
import com.taaskr.dto.provider.UpdateProviderCategoriesRequest;
import com.taaskr.dto.service.CategoryResponse;
import com.taaskr.entity.*;
import com.taaskr.enums.Role;
import com.taaskr.exception.BadRequestException;
import com.taaskr.exception.ResourceNotFoundException;
import com.taaskr.repository.*;
import com.taaskr.service.BookingService;
import com.taaskr.service.ProviderWorkflowService;
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
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class ProviderCategoryTests {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProviderProfileRepository providerProfileRepository;

    @Autowired
    private ServiceCategoryRepository serviceCategoryRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private AvailabilitySlotRepository availabilitySlotRepository;

    @Autowired
    private ProviderWorkflowService providerWorkflowService;

    @Autowired
    private BookingService bookingService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User providerUser;
    private ProviderProfile providerProfile;
    private ServiceCategory activeCat1;
    private ServiceCategory activeCat2;
    private ServiceCategory inactiveCat;
    private Service cleaningService;

    @BeforeEach
    void setUp() {
        providerUser = new User();
        providerUser.setName("Test Provider");
        providerUser.setEmail("provider_test@taaskr.com");
        providerUser.setPassword(passwordEncoder.encode("password123"));
        providerUser.setRole(Role.PROVIDER);
        providerUser.setCity("Mumbai");
        providerUser.setPincode("400001");
        providerUser.setPhone("9876543210");
        providerUser.setEnabled(true);
        providerUser = userRepository.save(providerUser);

        providerProfile = new ProviderProfile();
        providerProfile.setUser(providerUser);
        providerProfile.setExperienceYears(5);
        providerProfile.setCity("Mumbai");
        providerProfile.setPincode("400001");
        providerProfile.setApproved(true);
        providerProfile.setRating(5.0);
        providerProfile.setTotalJobs(10);
        providerProfile = providerProfileRepository.save(providerProfile);

        activeCat1 = new ServiceCategory();
        activeCat1.setName("Home Cleaning");
        activeCat1.setDescription("Cleaning services");
        activeCat1.setActive(true);
        activeCat1 = serviceCategoryRepository.save(activeCat1);

        activeCat2 = new ServiceCategory();
        activeCat2.setName("Plumbing");
        activeCat2.setDescription("Plumbing services");
        activeCat2.setActive(true);
        activeCat2 = serviceCategoryRepository.save(activeCat2);

        inactiveCat = new ServiceCategory();
        inactiveCat.setName("Carpentry");
        inactiveCat.setDescription("Carpentry services");
        inactiveCat.setActive(false);
        inactiveCat = serviceCategoryRepository.save(inactiveCat);

        cleaningService = new Service();
        cleaningService.setName("Deep Cleaning");
        cleaningService.setDescription("Full home deep clean");
        cleaningService.setCategory(activeCat1);
        cleaningService.setPrice(BigDecimal.valueOf(1500));
        cleaningService.setDurationMinutes(120);
        cleaningService.setActive(true);
        cleaningService = serviceRepository.save(cleaningService);

        AvailabilitySlot slot = new AvailabilitySlot();
        slot.setProvider(providerProfile);
        slot.setAvailableDate(LocalDate.now().plusDays(2));
        slot.setStartTime(LocalTime.of(9, 0));
        slot.setEndTime(LocalTime.of(18, 0));
        slot.setBooked(false);
        availabilitySlotRepository.save(slot);
    }

    @Test
    void testCategoryAssignmentAndRetrieval() {
        UpdateProviderCategoriesRequest request = new UpdateProviderCategoriesRequest(List.of(activeCat1.getId(), activeCat2.getId()));
        List<CategoryResponse> updated = providerWorkflowService.updateMyCategories(providerUser.getEmail(), request);

        assertEquals(2, updated.size());
        assertTrue(updated.stream().anyMatch(c -> c.getName().equals("Home Cleaning")));
        assertTrue(updated.stream().anyMatch(c -> c.getName().equals("Plumbing")));

        List<CategoryResponse> fetched = providerWorkflowService.getMyCategories(providerUser.getEmail());
        assertEquals(2, fetched.size());
    }

    @Test
    void testInactiveCategoryRejection() {
        UpdateProviderCategoriesRequest request = new UpdateProviderCategoriesRequest(List.of(inactiveCat.getId()));
        assertThrows(BadRequestException.class, () -> {
            providerWorkflowService.updateMyCategories(providerUser.getEmail(), request);
        });
    }

    @Test
    void testNonExistentCategoryRejection() {
        UpdateProviderCategoriesRequest request = new UpdateProviderCategoriesRequest(List.of(999999L));
        assertThrows(ResourceNotFoundException.class, () -> {
            providerWorkflowService.updateMyCategories(providerUser.getEmail(), request);
        });
    }

    @Test
    void testBookingAvailabilityFiltersByCategory() {
        // Without mapping to activeCat1, provider should not appear in available providers for cleaningService
        List<AvailableProviderResponse> before = bookingService.getAvailableProviders(
                cleaningService.getId(),
                "Mumbai",
                "400001",
                LocalDate.now().plusDays(2),
                LocalTime.of(10, 0)
        );
        assertTrue(before.isEmpty());

        // Assign activeCat1 to provider
        providerWorkflowService.updateMyCategories(providerUser.getEmail(), new UpdateProviderCategoriesRequest(List.of(activeCat1.getId())));

        List<AvailableProviderResponse> after = bookingService.getAvailableProviders(
                cleaningService.getId(),
                "Mumbai",
                "400001",
                LocalDate.now().plusDays(2),
                LocalTime.of(10, 0)
        );
        assertEquals(1, after.size());
        assertEquals(providerProfile.getId(), after.get(0).providerId());
    }
}
