package com.taaskr;

import com.taaskr.dto.service.CategoryResponse;
import com.taaskr.dto.service.ServiceResponse;
import com.taaskr.entity.Service;
import com.taaskr.entity.ServiceCategory;
import com.taaskr.event.BookingCreatedEvent;
import com.taaskr.listener.BookingEventListener;
import com.taaskr.repository.ServiceCategoryRepository;
import com.taaskr.repository.ServiceRepository;
import com.taaskr.service.CatalogService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cache.CacheManager;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class CachingAndEventTests {

    @Autowired
    private CatalogService catalogService;

    @Autowired
    private ServiceCategoryRepository categoryRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private CacheManager cacheManager;

    @Autowired
    private BookingEventListener bookingEventListener;

    @BeforeEach
    void setUp() {
        if (cacheManager.getCache("categories") != null) {
            cacheManager.getCache("categories").clear();
        }
        if (cacheManager.getCache("services") != null) {
            cacheManager.getCache("services").clear();
        }

        ServiceCategory plumbing = new ServiceCategory();
        plumbing.setName("Plumbing Cache Test");
        plumbing.setDescription("Plumbing services for caching test");
        plumbing.setActive(true);
        plumbing = categoryRepository.save(plumbing);

        Service tapFix = new Service();
        tapFix.setName("Tap Leak Fix");
        tapFix.setCategory(plumbing);
        tapFix.setPrice(BigDecimal.valueOf(299));
        tapFix.setDurationMinutes(45);
        tapFix.setActive(true);
        serviceRepository.save(tapFix);
    }

    @Test
    void testCatalogCaching() {
        // First call populates cache
        List<CategoryResponse> firstCall = catalogService.getAllActiveCategories();
        assertNotNull(firstCall);
        assertFalse(firstCall.isEmpty());

        // Second call retrieves from cache
        List<CategoryResponse> secondCall = catalogService.getAllActiveCategories();
        assertNotNull(secondCall);
        assertEquals(firstCall.size(), secondCall.size());

        // Verify cache contains value under key 'all'
        assertNotNull(cacheManager.getCache("categories").get("all"));
    }

    @Test
    void testServiceCaching() {
        List<ServiceResponse> services1 = catalogService.getAllActiveServices(null);
        assertNotNull(services1);
        assertFalse(services1.isEmpty());

        List<ServiceResponse> services2 = catalogService.getAllActiveServices(null);
        assertNotNull(services2);
        assertEquals(services1.size(), services2.size());
    }

    @Test
    void testBookingEventListener() {
        BookingCreatedEvent event = new BookingCreatedEvent(
                999L, 1L, "customer@example.com", 2L, "Tap Leak Fix"
        );
        assertDoesNotThrow(() -> bookingEventListener.handleBookingCreated(event));
    }
}
