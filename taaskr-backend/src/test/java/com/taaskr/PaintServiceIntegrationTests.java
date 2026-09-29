package com.taaskr;

import com.taaskr.dto.booking.AvailableProviderResponse;
import com.taaskr.dto.booking.BookingResponse;
import com.taaskr.dto.booking.CreateBookingRequest;
import com.taaskr.dto.service.ServiceResponse;
import com.taaskr.entity.Service;
import com.taaskr.entity.ServiceCategory;
import com.taaskr.entity.User;
import com.taaskr.enums.PaymentMethod;
import com.taaskr.enums.Role;
import com.taaskr.repository.ServiceCategoryRepository;
import com.taaskr.repository.ServiceRepository;
import com.taaskr.repository.UserRepository;
import com.taaskr.service.BookingService;
import com.taaskr.service.CatalogService;
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

@SpringBootTest(properties = "app.seed.demo-data=true")
@ActiveProfiles("test")
@Transactional
public class PaintServiceIntegrationTests {

    @Autowired
    private CatalogService catalogService;

    @Autowired
    private BookingService bookingService;

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private ServiceCategoryRepository serviceCategoryRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User testCustomer;

    @BeforeEach
    public void setUp() {
        testCustomer = userRepository.findByEmail("customer.paint.test@taaskr.com")
                .orElseGet(() -> {
                    User u = new User();
                    u.setEmail("customer.paint.test@taaskr.com");
                    u.setName("Paint Test Customer");
                    u.setPhone("+91 99988-77665");
                    u.setPassword(passwordEncoder.encode("Password@123"));
                    u.setRole(Role.USER);
                    u.setEnabled(true);
                    u.setEmailVerified(true);
                    u.setPhoneVerified(true);
                    return userRepository.save(u);
                });
    }

    @Test
    public void testPaintServicesSeededUnderCivilCategory() {
        ServiceCategory civilCategory = serviceCategoryRepository.findByNameIgnoreCase("Civil & Property Maintenance")
                .orElseThrow(() -> new AssertionError("Civil & Property Maintenance category should exist"));

        List<Service> services = serviceRepository.findByActiveTrueOrderByNameAsc();

        String[] expectedPaintServices = {
                "Interior Wall Painting",
                "Exterior Wall Painting",
                "Full House Painting",
                "Door & Window Painting",
                "Wall Repainting",
                "Texture Painting",
                "Waterproof Painting",
                "Commercial Painting",
                "Touch-Up & Minor Painting",
                "Putty & Primer Work"
        };

        for (String expectedName : expectedPaintServices) {
            boolean found = services.stream().anyMatch(s ->
                    s.getName().equalsIgnoreCase(expectedName) &&
                    s.getCategory().getId().equals(civilCategory.getId())
            );
            assertTrue(found, "Service '" + expectedName + "' must be seeded under Civil & Property Maintenance category");
        }
    }

    @Test
    public void testCatalogServiceReturnsPaintServices() {
        ServiceCategory civilCategory = serviceCategoryRepository.findByNameIgnoreCase("Civil & Property Maintenance")
                .orElseThrow(() -> new AssertionError("Civil & Property Maintenance category should exist"));

        List<ServiceResponse> civilServices = catalogService.getAllActiveServices(civilCategory.getId());
        assertFalse(civilServices.isEmpty(), "Civil services list should not be empty");

        boolean containsInteriorPainting = civilServices.stream()
                .anyMatch(s -> s.getName().equalsIgnoreCase("Interior Wall Painting"));
        assertTrue(containsInteriorPainting, "CatalogService must return 'Interior Wall Painting'");
    }

    @Test
    public void testPaintBookingCreationWithCustomMetadata() {
        Service interiorPainting = serviceRepository.findByActiveTrueOrderByNameAsc().stream()
                .filter(s -> s.getName().equalsIgnoreCase("Interior Wall Painting"))
                .findFirst()
                .orElseThrow(() -> new AssertionError("Interior Wall Painting service not found"));

        CreateBookingRequest request = new CreateBookingRequest();
        request.setServiceId(interiorPainting.getId());
        request.setPaymentMethod(PaymentMethod.ONLINE);
        request.setBookingDate(LocalDate.now().plusDays(1));
        request.setStartTime(LocalTime.of(10, 0));
        request.setAddress("402 Sunshine Towers, Vijay Nagar");
        request.setCity("Indore");
        request.setPincode("452010");
        request.setLatitude(new BigDecimal("22.7533"));
        request.setLongitude(new BigDecimal("75.8937"));
        request.setPackageDescription("Property: Apartment | Area: 1200 Sq.Ft | Surface: Minor Damage / Cracks | Paint: Taaskr/Provider Provides Material | Inspection & Estimate Required");
        request.setNotes("Please bring shade cards for royal luxury emulsion finish.");

        BookingResponse response = bookingService.createBooking(testCustomer.getEmail(), request);

        assertNotNull(response);
        assertNotNull(response.getBookingCode());
        assertEquals(interiorPainting.getId(), response.getServiceId());
        assertTrue(response.getPackageDescription().contains("Apartment"));
        assertTrue(response.getPackageDescription().contains("1200 Sq.Ft"));
        assertTrue(response.getNotes().contains("shade cards"));
    }

    @Test
    public void testPainterProviderEligibility() {
        Service interiorPainting = serviceRepository.findByActiveTrueOrderByNameAsc().stream()
                .filter(s -> s.getName().equalsIgnoreCase("Interior Wall Painting"))
                .findFirst()
                .orElseThrow(() -> new AssertionError("Interior Wall Painting service not found"));

        List<AvailableProviderResponse> providers = bookingService.getAvailableProviders(
                interiorPainting.getId(),
                "Indore",
                "452010",
                LocalDate.now().plusDays(1),
                LocalTime.of(10, 0)
        );

        assertNotNull(providers, "Available providers response must not be null");
    }
}
