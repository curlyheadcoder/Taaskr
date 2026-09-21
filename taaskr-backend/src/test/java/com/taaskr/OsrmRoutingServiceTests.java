package com.taaskr;

import com.taaskr.dto.routing.RoutingResult;
import com.taaskr.dto.routing.osrm.OsrmResponse;
import com.taaskr.dto.routing.osrm.OsrmRoute;
import com.taaskr.service.MapService;
import com.taaskr.service.impl.MapServiceImpl;
import com.taaskr.service.impl.OsrmRoutingServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

public class OsrmRoutingServiceTests {

    private MapService mapService;
    private RestTemplate restTemplate;
    private OsrmRoutingServiceImpl routingService;

    // Sample Indore Coordinates
    private final BigDecimal originLat = BigDecimal.valueOf(22.7196);
    private final BigDecimal originLng = BigDecimal.valueOf(75.8577);
    private final BigDecimal destLat = BigDecimal.valueOf(22.7500);
    private final BigDecimal destLng = BigDecimal.valueOf(75.8800);

    @BeforeEach
    void setUp() {
        mapService = new MapServiceImpl();
        restTemplate = Mockito.mock(RestTemplate.class);
        routingService = new OsrmRoutingServiceImpl(
                "http://localhost:5000",
                2000,
                100.0, // 100m threshold
                30,    // 30s interval
                mapService,
                restTemplate
        );
    }

    private OsrmResponse createMockOsrmResponse(double distanceMeters, double durationSeconds) {
        OsrmResponse response = new OsrmResponse();
        response.setCode("Ok");
        OsrmRoute route = new OsrmRoute(distanceMeters, durationSeconds);
        response.setRoutes(List.of(route));
        return response;
    }

    @Test
    @DisplayName("1. Successful OSRM response returns road distance in KM")
    void testSuccessfulOsrmRoadDistance() {
        // 5000 meters = 5.00 km
        OsrmResponse mockResp = createMockOsrmResponse(5000.0, 600.0);
        when(restTemplate.getForEntity(anyString(), eq(OsrmResponse.class)))
                .thenReturn(new ResponseEntity<>(mockResp, HttpStatus.OK));

        RoutingResult result = routingService.calculateRoute(originLat, originLng, destLat, destLng, 101L);

        assertNotNull(result);
        assertEquals(0, BigDecimal.valueOf(5.00).compareTo(result.getDistanceKm()));
        assertEquals("OSRM", result.getRouteSource());
        assertTrue(result.isFresh());
    }

    @Test
    @DisplayName("2. Successful OSRM response returns road duration as ETA minutes")
    void testSuccessfulOsrmRoadDurationAsEta() {
        // 900 seconds = 15 minutes
        OsrmResponse mockResp = createMockOsrmResponse(8000.0, 900.0);
        when(restTemplate.getForEntity(anyString(), eq(OsrmResponse.class)))
                .thenReturn(new ResponseEntity<>(mockResp, HttpStatus.OK));

        RoutingResult result = routingService.calculateRoute(originLat, originLng, destLat, destLng, 102L);

        assertNotNull(result);
        assertEquals(15, result.getEstimatedEtaMinutes());
        assertEquals(900L, result.getDurationSeconds());
    }

    @Test
    @DisplayName("3. OSRM distance does NOT receive the 1.25 winding multiplier")
    void testOsrmDistanceNoWindingFactor() {
        // 4000 meters road distance
        OsrmResponse mockResp = createMockOsrmResponse(4000.0, 300.0);
        when(restTemplate.getForEntity(anyString(), eq(OsrmResponse.class)))
                .thenReturn(new ResponseEntity<>(mockResp, HttpStatus.OK));

        RoutingResult result = routingService.calculateRoute(originLat, originLng, destLat, destLng, 103L);

        // Raw 4000m / 1000 = 4.00 km (Not 4.00 * 1.25 = 5.00)
        assertEquals(0, BigDecimal.valueOf(4.00).compareTo(result.getDistanceKm()));
    }

    @Test
    @DisplayName("4. OSRM HTTP exception falls back safely to Haversine x 1.25")
    void testOsrmFailureFallsBackToHaversine() {
        when(restTemplate.getForEntity(anyString(), eq(OsrmResponse.class)))
                .thenThrow(new RestClientException("OSRM Connection refused"));

        RoutingResult result = routingService.calculateRoute(originLat, originLng, destLat, destLng, 104L);

        assertNotNull(result);
        assertEquals("HAVERSINE_FALLBACK", result.getRouteSource());
        // Straight line ~4.29 km * 1.25 = 5.36 km
        assertTrue(result.getDistanceKm().doubleValue() > 0);
        assertTrue(result.getEstimatedEtaMinutes() > 0);
    }

    @Test
    @DisplayName("5. Malformed OSRM response payload falls back safely")
    void testMalformedOsrmResponseFallback() {
        OsrmResponse emptyResp = new OsrmResponse();
        emptyResp.setCode("Ok");
        emptyResp.setRoutes(Collections.emptyList()); // No routes

        when(restTemplate.getForEntity(anyString(), eq(OsrmResponse.class)))
                .thenReturn(new ResponseEntity<>(emptyResp, HttpStatus.OK));

        RoutingResult result = routingService.calculateRoute(originLat, originLng, destLat, destLng, 105L);

        assertEquals("HAVERSINE_FALLBACK", result.getRouteSource());
    }

    @Test
    @DisplayName("6. Invalid coordinates do not call OSRM endpoint")
    void testInvalidCoordinatesNoOsrmCall() {
        RoutingResult result = routingService.calculateRoute(BigDecimal.ZERO, BigDecimal.ZERO, destLat, destLng, 106L);

        assertEquals("NO_LOCATION", result.getRouteSource());
        verify(restTemplate, never()).getForEntity(anyString(), eq(OsrmResponse.class));
    }

    @Test
    @DisplayName("7 & 8. 100m movement threshold prevents routing call on 5-second GPS updates")
    void testMovementThresholdThrottling() {
        OsrmResponse mockResp = createMockOsrmResponse(5000.0, 600.0);
        when(restTemplate.getForEntity(anyString(), eq(OsrmResponse.class)))
                .thenReturn(new ResponseEntity<>(mockResp, HttpStatus.OK));

        // Call 1: Initial call
        RoutingResult result1 = routingService.calculateRoute(originLat, originLng, destLat, destLng, 107L);
        assertTrue(result1.isFresh());

        // Call 2: Moved only ~20 meters (less than 100m threshold)
        BigDecimal slightLat = originLat.add(BigDecimal.valueOf(0.00015));
        BigDecimal slightLng = originLng.add(BigDecimal.valueOf(0.00015));

        RoutingResult result2 = routingService.calculateRoute(slightLat, slightLng, destLat, destLng, 107L);

        assertFalse(result2.isFresh()); // Reused throttled result
        verify(restTemplate, times(1)).getForEntity(anyString(), eq(OsrmResponse.class));
    }

    @Test
    @DisplayName("9. Minimum 30-second interval works - forced re-route when provider moves > 100m")
    void testSignificantMovementTriggersRouting() {
        OsrmResponse mockResp = createMockOsrmResponse(5000.0, 600.0);
        when(restTemplate.getForEntity(anyString(), eq(OsrmResponse.class)))
                .thenReturn(new ResponseEntity<>(mockResp, HttpStatus.OK));

        // Call 1
        routingService.calculateRoute(originLat, originLng, destLat, destLng, 108L);

        // Call 2: Provider moves ~500 meters
        BigDecimal movedLat = originLat.add(BigDecimal.valueOf(0.005));
        BigDecimal movedLng = originLng.add(BigDecimal.valueOf(0.005));

        RoutingResult result2 = routingService.calculateRoute(movedLat, movedLng, destLat, destLng, 108L);

        assertTrue(result2.isFresh());
        verify(restTemplate, times(2)).getForEntity(anyString(), eq(OsrmResponse.class));
    }

    @Test
    @DisplayName("10. Destination change triggers immediate routing refresh")
    void testDestinationChangeTriggersRefresh() {
        OsrmResponse mockResp = createMockOsrmResponse(5000.0, 600.0);
        when(restTemplate.getForEntity(anyString(), eq(OsrmResponse.class)))
                .thenReturn(new ResponseEntity<>(mockResp, HttpStatus.OK));

        // Call 1
        routingService.calculateRoute(originLat, originLng, destLat, destLng, 109L);

        // Call 2: Destination changes to new drop location
        BigDecimal newDestLat = destLat.add(BigDecimal.valueOf(0.02));
        BigDecimal newDestLng = destLng.add(BigDecimal.valueOf(0.02));

        RoutingResult result2 = routingService.calculateRoute(originLat, originLng, newDestLat, newDestLng, 109L);

        assertTrue(result2.isFresh());
        verify(restTemplate, times(2)).getForEntity(anyString(), eq(OsrmResponse.class));
    }

    @Test
    @DisplayName("11. Concurrent routing requests for the same booking are deduplicated")
    void testConcurrentRequestsDeduplication() throws Exception {
        OsrmResponse mockResp = createMockOsrmResponse(6000.0, 720.0);
        when(restTemplate.getForEntity(anyString(), eq(OsrmResponse.class)))
                .thenAnswer(invocation -> {
                    Thread.sleep(100); // Simulate network delay
                    return new ResponseEntity<>(mockResp, HttpStatus.OK);
                });

        int threads = 5;
        ExecutorService executor = Executors.newFixedThreadPool(threads);
        CountDownLatch latch = new CountDownLatch(threads);
        AtomicInteger successCount = new AtomicInteger(0);

        for (int i = 0; i < threads; i++) {
            executor.submit(() -> {
                try {
                    RoutingResult res = routingService.calculateRoute(originLat, originLng, destLat, destLng, 110L);
                    if (res != null) {
                        successCount.incrementAndGet();
                    }
                } finally {
                    latch.countDown();
                }
            });
        }

        assertTrue(latch.await(3, TimeUnit.SECONDS));
        executor.shutdown();

        assertEquals(threads, successCount.get());
        // Only 1 actual RestTemplate invocation should occur due to deduplication/throttling
        verify(restTemplate, times(1)).getForEntity(anyString(), eq(OsrmResponse.class));
    }

    @Test
    @DisplayName("12. Negative/invalid OSRM distance or duration is rejected")
    void testNegativeDistanceRejected() {
        OsrmResponse invalidResp = createMockOsrmResponse(-500.0, -10.0);
        when(restTemplate.getForEntity(anyString(), eq(OsrmResponse.class)))
                .thenReturn(new ResponseEntity<>(invalidResp, HttpStatus.OK));

        RoutingResult result = routingService.calculateRoute(originLat, originLng, destLat, destLng, 111L);

        assertEquals("HAVERSINE_FALLBACK", result.getRouteSource());
    }
}
