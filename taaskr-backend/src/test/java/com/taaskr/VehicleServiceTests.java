package com.taaskr;

import com.taaskr.dto.vehicle.VehicleEstimateOptionResponse;
import com.taaskr.dto.vehicle.VehicleEstimateRequest;
import com.taaskr.dto.vehicle.VehicleEstimateResponse;
import com.taaskr.entity.*;
import com.taaskr.enums.FuelType;
import com.taaskr.enums.Role;
import com.taaskr.enums.VehicleType;
import com.taaskr.repository.*;
import com.taaskr.service.*;
import com.taaskr.service.impl.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

class VehicleServiceTests {

    private MapService mapService;
    private VehiclePricingRuleRepository pricingRuleRepository;
    private VehiclePricingService pricingService;
    private VehicleRepository vehicleRepository;
    private ServiceRepository serviceRepository;
    private ServiceCategoryRepository categoryRepository;
    private VehicleEligibilityService eligibilityService;
    private BookingRepository bookingRepository;
    private VehicleDispatchService dispatchService;

    @BeforeEach
    void setUp() {
        mapService = new MapServiceImpl();
        pricingRuleRepository = Mockito.mock(VehiclePricingRuleRepository.class);
        pricingService = new VehiclePricingServiceImpl(pricingRuleRepository);
        vehicleRepository = Mockito.mock(VehicleRepository.class);
        serviceRepository = Mockito.mock(ServiceRepository.class);
        categoryRepository = Mockito.mock(ServiceCategoryRepository.class);
        bookingRepository = Mockito.mock(BookingRepository.class);

        eligibilityService = new VehicleEligibilityServiceImpl(
                mapService,
                pricingService,
                vehicleRepository,
                serviceRepository,
                categoryRepository
        );

        dispatchService = new VehicleDispatchServiceImpl(
                vehicleRepository,
                bookingRepository,
                mapService
        );
    }

    @Test
    @DisplayName("MapService calculates accurate distance using Haversine formula")
    void testMapServiceDistance() {
        // Indore Rajwada (22.7196, 75.8577) to Vijay Nagar Indore (22.7533, 75.8937) ~ 5.2 km straight line * 1.25 winding factor
        BigDecimal distance = mapService.calculateDistanceKm(
                BigDecimal.valueOf(22.7196), BigDecimal.valueOf(75.8577),
                BigDecimal.valueOf(22.7533), BigDecimal.valueOf(75.8937)
        );

        assertNotNull(distance);
        assertTrue(distance.compareTo(BigDecimal.valueOf(3.0)) > 0);
        assertTrue(distance.compareTo(BigDecimal.valueOf(15.0)) < 0);
    }

    @Test
    @DisplayName("VehiclePricingService computes fare accurately according to rules")
    void testVehiclePricingCalculation() {
        // Mock Mini Truck rule: Base ₹250 (3 km), ₹32/km thereafter, Min ₹250
        VehiclePricingRule miniTruckRule = new VehiclePricingRule(
                VehicleType.MINI_TRUCK,
                "Mini Truck (Tata Ace)",
                new BigDecimal("250.00"),
                new BigDecimal("3.0"),
                new BigDecimal("32.00"),
                new BigDecimal("250.00"),
                new BigDecimal("1000.00")
        );
        when(pricingRuleRepository.findByVehicleTypeAndActiveTrue(VehicleType.MINI_TRUCK))
                .thenReturn(Optional.of(miniTruckRule));

        // 2 km trip -> Minimum / Base fare = ₹250
        BigDecimal shortTripPrice = pricingService.calculatePrice(VehicleType.MINI_TRUCK, BigDecimal.valueOf(2.0));
        assertEquals(new BigDecimal("250.00"), shortTripPrice);

        // 10 km trip -> 250 + (10 - 3) * 32 = 250 + 224 = ₹474.00
        BigDecimal longTripPrice = pricingService.calculatePrice(VehicleType.MINI_TRUCK, BigDecimal.valueOf(10.0));
        assertEquals(new BigDecimal("474.00"), longTripPrice);
    }

    @Test
    @DisplayName("VehicleEligibilityService filters by package weight capacity")
    void testVehicleEligibilityWeightChecks() {
        ServiceCategory vehicleCat = new ServiceCategory();
        vehicleCat.setId(10L);
        vehicleCat.setName("On-Demand Vehicle");
        when(categoryRepository.findAll()).thenReturn(List.of(vehicleCat));
        when(serviceRepository.findByCategoryIdAndActiveTrueOrderByNameAsc(10L)).thenReturn(List.of());

        VehicleEstimateRequest request = new VehicleEstimateRequest();
        request.setPickupCity("Indore");
        request.setDropCity("Indore");
        request.setPackageWeightKg(BigDecimal.valueOf(400.0)); // 400 KG package

        VehicleEstimateResponse response = eligibilityService.estimateVehicleOptions(request);
        assertNotNull(response);
        assertEquals(7, response.getOptions().size());

        // Two wheeler (20kg limit) should NOT be eligible
        VehicleEstimateOptionResponse bike = response.getOptions().stream()
                .filter(o -> o.getVehicleType() == VehicleType.TWO_WHEELER_ELECTRIC)
                .findFirst().orElseThrow();
        assertFalse(bike.getIsEligible());

        // Mini Truck (1000kg limit) SHOULD be eligible
        VehicleEstimateOptionResponse miniTruck = response.getOptions().stream()
                .filter(o -> o.getVehicleType() == VehicleType.MINI_TRUCK)
                .findFirst().orElseThrow();
        assertTrue(miniTruck.getIsEligible());
    }

    @Test
    @DisplayName("VehicleDispatchService selects nearest available driver without overlaps")
    void testVehicleDispatchNearestDriver() {
        User u1 = new User();
        u1.setName("Driver 1");
        u1.setEnabled(true);
        u1.setRole(Role.PROVIDER);

        ProviderProfile p1 = new ProviderProfile();
        p1.setId(101L);
        p1.setUser(u1);
        p1.setApproved(true);
        p1.setCity("Indore");
        p1.setRating(4.8);

        Vehicle v1 = new Vehicle();
        v1.setId(201L);
        v1.setProvider(p1);
        v1.setVehicleType(VehicleType.MINI_TRUCK);
        v1.setFuelType(FuelType.DIESEL);
        v1.setRegistrationNumber("MP-09-AA-1111");
        v1.setActive(true);
        v1.setAvailable(true);
        v1.setCurrentLatitude(BigDecimal.valueOf(22.7200));
        v1.setCurrentLongitude(BigDecimal.valueOf(75.8580));

        when(vehicleRepository.findAvailableVehiclesInCity(VehicleType.MINI_TRUCK, "Indore"))
                .thenReturn(List.of(v1));
        when(bookingRepository.existsByProviderIdAndBookingDateAndStartTimeLessThanAndEndTimeGreaterThan(
                eq(101L), any(), any(), any()
        )).thenReturn(false);

        var matchOpt = dispatchService.findBestDriverForTrip(
                VehicleType.MINI_TRUCK,
                "Indore",
                "452001",
                BigDecimal.valueOf(22.7196),
                BigDecimal.valueOf(75.8577),
                LocalDate.now(),
                LocalTime.of(10, 0),
                LocalTime.of(11, 30)
        );

        assertTrue(matchOpt.isPresent());
        assertEquals(101L, matchOpt.get().provider().getId());
        assertEquals("MP-09-AA-1111", matchOpt.get().vehicle().getRegistrationNumber());
    }
}
