package com.taaskr.service.impl;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.taaskr.dto.routing.RoutingResult;
import com.taaskr.dto.routing.osrm.OsrmResponse;
import com.taaskr.dto.routing.osrm.OsrmRoute;
import com.taaskr.service.MapService;
import com.taaskr.service.RoutingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Locale;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Service
public class OsrmRoutingServiceImpl implements RoutingService {

    private static final Logger log = LoggerFactory.getLogger(OsrmRoutingServiceImpl.class);

    private final String baseUrl;
    private final int timeoutMs;
    private final double minMovementMeters;
    private final int minIntervalSeconds;
    private final MapService mapService;
    private final RestTemplate restTemplate;

    // Bounded & TTL-backed Caffeine cache for active booking routing states
    private final Cache<Long, BookingRoutingState> routingCache;
    private final ConcurrentHashMap<Long, CompletableFuture<RoutingResult>> inFlightRequests = new ConcurrentHashMap<>();

    private static class BookingRoutingState {
        BigDecimal originLat;
        BigDecimal originLng;
        BigDecimal destLat;
        BigDecimal destLng;
        long timestampMs;
        RoutingResult result;
    }

    @Autowired
    public OsrmRoutingServiceImpl(
            @Value("${taaskr.routing.osrm.base-url:http://localhost:5000}") String baseUrl,
            @Value("${taaskr.routing.osrm.timeout-ms:2000}") int timeoutMs,
            @Value("${taaskr.routing.min-movement-meters:100.0}") double minMovementMeters,
            @Value("${taaskr.routing.min-interval-seconds:30}") int minIntervalSeconds,
            MapService mapService) {
        this(baseUrl, timeoutMs, minMovementMeters, minIntervalSeconds, mapService, createDefaultRestTemplate(timeoutMs));
    }

    public OsrmRoutingServiceImpl(
            String baseUrl,
            int timeoutMs,
            double minMovementMeters,
            int minIntervalSeconds,
            MapService mapService,
            RestTemplate restTemplate) {
        this.baseUrl = baseUrl != null ? baseUrl.replaceAll("/+$", "") : "http://localhost:5000";
        this.timeoutMs = timeoutMs > 0 ? timeoutMs : 2000;
        this.minMovementMeters = minMovementMeters >= 0 ? minMovementMeters : 100.0;
        this.minIntervalSeconds = minIntervalSeconds >= 0 ? minIntervalSeconds : 30;
        this.mapService = mapService;
        this.restTemplate = restTemplate;
        this.routingCache = Caffeine.newBuilder()
                .maximumSize(1000)
                .expireAfterWrite(15, TimeUnit.MINUTES)
                .build();
    }

    private static RestTemplate createDefaultRestTemplate(int timeoutMs) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(timeoutMs > 0 ? timeoutMs : 2000);
        factory.setReadTimeout(timeoutMs > 0 ? timeoutMs : 2000);
        return new RestTemplate(factory);
    }

    @Override
    public RoutingResult calculateRoute(BigDecimal originLat, BigDecimal originLng, BigDecimal destLat, BigDecimal destLng, Long bookingId) {
        // 1. Coordinate Validation
        if (!isValidCoordinate(originLat, originLng) || !isValidCoordinate(destLat, destLng)) {
            return createFallbackResult(originLat, originLng, destLat, destLng, "NO_LOCATION");
        }

        long now = System.currentTimeMillis();

        // 2. Throttling & Cache evaluation for active bookings
        if (bookingId != null) {
            BookingRoutingState cachedState = routingCache.getIfPresent(bookingId);
            if (cachedState != null && cachedState.result != null) {
                boolean destMoved = isMoved(destLat, destLng, cachedState.destLat, cachedState.destLng, 10.0);
                if (!destMoved) {
                    long elapsedSeconds = (now - cachedState.timestampMs) / 1000;
                    double providerMovementMeters = calculateHaversineMeters(originLat, originLng, cachedState.originLat, cachedState.originLng);

                    if (providerMovementMeters < minMovementMeters && elapsedSeconds < minIntervalSeconds) {
                        RoutingResult cached = cachedState.result;
                        return new RoutingResult(
                                cached.getDistanceKm(),
                                cached.getEstimatedEtaMinutes(),
                                cached.getDurationSeconds(),
                                cached.getDistanceMeters(),
                                cached.getRouteSource(),
                                false // Reused/throttled result
                        );
                    }
                }
            }

            // 3. In-flight Request Deduplication
            CompletableFuture<RoutingResult> pending = inFlightRequests.get(bookingId);
            if (pending != null) {
                try {
                    return pending.get(timeoutMs + 500, TimeUnit.MILLISECONDS);
                } catch (Exception ignored) {
                    // Fallback to issuing request if pending failed/timed out
                }
            }
        }

        // 4. Issue Routing API Call with Deduplication
        CompletableFuture<RoutingResult> currentFuture = new CompletableFuture<>();
        if (bookingId != null) {
            CompletableFuture<RoutingResult> existing = inFlightRequests.putIfAbsent(bookingId, currentFuture);
            if (existing != null) {
                try {
                    return existing.get(timeoutMs + 500, TimeUnit.MILLISECONDS);
                } catch (Exception ignored) {
                }
            }
        }

        RoutingResult result = null;
        try {
            result = callOsrmApi(originLat, originLng, destLat, destLng);
            if (bookingId != null && "OSRM".equalsIgnoreCase(result.getRouteSource())) {
                BookingRoutingState newState = new BookingRoutingState();
                newState.originLat = originLat;
                newState.originLng = originLng;
                newState.destLat = destLat;
                newState.destLng = destLng;
                newState.timestampMs = now;
                newState.result = result;
                routingCache.put(bookingId, newState);
            }
        } catch (Exception e) {
            log.warn("OSRM routing request failed for bookingId={}: {} - Falling back to Haversine", bookingId, e.getMessage());
            result = createFallbackResult(originLat, originLng, destLat, destLng, "HAVERSINE_FALLBACK");
        } finally {
            currentFuture.complete(result);
            if (bookingId != null) {
                inFlightRequests.remove(bookingId);
            }
        }

        return result;
    }

    @Override
    public void clearBookingCache(Long bookingId) {
        if (bookingId != null) {
            routingCache.invalidate(bookingId);
            inFlightRequests.remove(bookingId);
        }
    }

    private RoutingResult callOsrmApi(BigDecimal originLat, BigDecimal originLng, BigDecimal destLat, BigDecimal destLng) {
        // OSRM format: /route/v1/driving/{lng1},{lat1};{lng2},{lat2}?overview=false
        String url = String.format(Locale.US, "%s/route/v1/driving/%.6f,%.6f;%.6f,%.6f?overview=false",
                baseUrl,
                originLng.doubleValue(),
                originLat.doubleValue(),
                destLng.doubleValue(),
                destLat.doubleValue());

        ResponseEntity<OsrmResponse> responseEntity = restTemplate.getForEntity(url, OsrmResponse.class);
        if (responseEntity.getStatusCode() == HttpStatus.OK && responseEntity.getBody() != null) {
            OsrmResponse body = responseEntity.getBody();
            if ("Ok".equalsIgnoreCase(body.getCode()) && body.getRoutes() != null && !body.getRoutes().isEmpty()) {
                OsrmRoute route = body.getRoutes().get(0);
                Double distMeters = route.getDistance();
                Double durationSecs = route.getDuration();

                if (distMeters != null && durationSecs != null && distMeters >= 0 && durationSecs >= 0
                        && !Double.isNaN(distMeters) && !Double.isInfinite(distMeters)
                        && !Double.isNaN(durationSecs) && !Double.isInfinite(durationSecs)) {

                    BigDecimal distKm = BigDecimal.valueOf(distMeters / 1000.0).setScale(2, RoundingMode.HALF_UP);
                    long durSeconds = Math.round(durationSecs);
                    int etaMinutes = (int) Math.round(durSeconds / 60.0);
                    if (distMeters > 0 && etaMinutes < 1) {
                        etaMinutes = 1; // Sensible minimum floor for non-zero distances
                    }

                    return new RoutingResult(distKm, etaMinutes, durSeconds, distMeters, "OSRM", true);
                }
            }
        }
        throw new RuntimeException("Invalid or malformed OSRM routing response payload");
    }

    private RoutingResult createFallbackResult(BigDecimal originLat, BigDecimal originLng, BigDecimal destLat, BigDecimal destLng, String source) {
        BigDecimal distKm = mapService.calculateDistanceKm(originLat, originLng, destLat, destLng);
        int etaMinutes = (int) Math.max(1, Math.round((distKm.doubleValue() / 25.0) * 60.0));
        if (distKm.doubleValue() < 0.2) {
            etaMinutes = 1;
        }
        return new RoutingResult(distKm, etaMinutes, (long) (etaMinutes * 60), distKm.doubleValue() * 1000.0, source, true);
    }

    private boolean isValidCoordinate(BigDecimal lat, BigDecimal lng) {
        if (lat == null || lng == null) {
            return false;
        }
        double dLat = lat.doubleValue();
        double dLng = lng.doubleValue();
        if (dLat < -90.0 || dLat > 90.0 || dLng < -180.0 || dLng > 180.0) {
            return false;
        }
        return !(dLat == 0.0 && dLng == 0.0);
    }

    private double calculateHaversineMeters(BigDecimal lat1, BigDecimal lon1, BigDecimal lat2, BigDecimal lon2) {
        if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
            return 0.0;
        }
        double r = 6371000.0; // Earth radius in meters
        double phi1 = Math.toRadians(lat1.doubleValue());
        double phi2 = Math.toRadians(lat2.doubleValue());
        double deltaPhi = Math.toRadians(lat2.doubleValue() - lat1.doubleValue());
        double deltaLambda = Math.toRadians(lon2.doubleValue() - lon1.doubleValue());

        double a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2)
                + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return r * c;
    }

    private boolean isMoved(BigDecimal lat1, BigDecimal lng1, BigDecimal lat2, BigDecimal lng2, double thresholdMeters) {
        return calculateHaversineMeters(lat1, lng1, lat2, lng2) >= thresholdMeters;
    }
}
