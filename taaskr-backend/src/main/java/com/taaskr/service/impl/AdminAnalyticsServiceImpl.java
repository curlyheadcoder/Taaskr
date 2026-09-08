package com.taaskr.service.impl;

import com.taaskr.dto.admin.analytics.AdminAnalyticsResponse;
import com.taaskr.entity.Booking;
import com.taaskr.enums.BookingStatus;
import com.taaskr.enums.PaymentStatus;
import com.taaskr.repository.BookingRepository;
import com.taaskr.repository.ProviderProfileRepository;
import com.taaskr.repository.UserRepository;
import com.taaskr.service.AdminAnalyticsService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.lang.management.ManagementFactory;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminAnalyticsServiceImpl implements AdminAnalyticsService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final ProviderProfileRepository providerProfileRepository;

    public AdminAnalyticsServiceImpl(BookingRepository bookingRepository,
                                     UserRepository userRepository,
                                     ProviderProfileRepository providerProfileRepository) {
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.providerProfileRepository = providerProfileRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public AdminAnalyticsResponse getPlatformAnalytics(int daysRange) {
        if (daysRange <= 0) {
            daysRange = 30;
        }

        List<Booking> allBookings = bookingRepository.findAll();
        long totalUsers = userRepository.count();
        long totalProviders = providerProfileRepository.count();
        long pendingProviderApprovals = providerProfileRepository.countByApprovedFalse();

        // 1. KPI Aggregations & Range-Specific Aggregations
        AdminAnalyticsResponse.KpiSummary kpi = new AdminAnalyticsResponse.KpiSummary();
        kpi.setTotalBookings(allBookings.size());
        kpi.setTotalUsers(totalUsers);
        kpi.setTotalProviders(totalProviders);
        kpi.setPendingProviderApprovals(pendingProviderApprovals);
        kpi.setDaysRange(daysRange);

        long completed = 0;
        long active = 0;
        long pending = 0;
        long cancelled = 0;
        BigDecimal totalRevenue = BigDecimal.ZERO;

        LocalDate today = LocalDate.now();
        LocalDate rangeStartDate = daysRange == 1 ? today : today.minusDays(daysRange - 1);
        LocalDate prevPeriodStartDate = daysRange == 1 ? today.minusDays(1) : today.minusDays((daysRange * 2) - 1);
        LocalDate prevPeriodEndDate = daysRange == 1 ? today.minusDays(1) : today.minusDays(daysRange);

        long rangeBookingsCount = 0;
        long rangeCompletedCount = 0;
        BigDecimal rangeRevenue = BigDecimal.ZERO;
        BigDecimal prevPeriodRevenue = BigDecimal.ZERO;

        Map<String, Long> statusCounts = new LinkedHashMap<>();
        for (BookingStatus status : BookingStatus.values()) {
            statusCounts.put(status.name(), 0L);
        }

        for (Booking b : allBookings) {
            BookingStatus status = b.getStatus();
            if (status != null) {
                statusCounts.put(status.name(), statusCounts.getOrDefault(status.name(), 0L) + 1);

                switch (status) {
                    case COMPLETED -> completed++;
                    case ASSIGNED, ACCEPTED, IN_PROGRESS, IN_TRANSIT -> active++;
                    case PENDING -> pending++;
                    case CANCELLED -> cancelled++;
                    default -> {}
                }
            }

            LocalDate bDate = b.getBookingDate();
            if (bDate == null && b.getCreatedAt() != null) {
                bDate = b.getCreatedAt().toLocalDate();
            }

            boolean isPaidOrDone = (b.getPaymentStatus() == PaymentStatus.PAID || b.getStatus() == BookingStatus.COMPLETED);
            BigDecimal bookingAmt = b.getFinalAmount() != null ? b.getFinalAmount() : BigDecimal.ZERO;

            // Lifetime revenue
            if (isPaidOrDone) {
                totalRevenue = totalRevenue.add(bookingAmt);
            }

            // In-range calculations
            if (bDate != null) {
                if (!bDate.isBefore(rangeStartDate) && !bDate.isAfter(today)) {
                    rangeBookingsCount++;
                    if (b.getStatus() == BookingStatus.COMPLETED) {
                        rangeCompletedCount++;
                    }
                    if (isPaidOrDone) {
                        rangeRevenue = rangeRevenue.add(bookingAmt);
                    }
                } else if (!bDate.isBefore(prevPeriodStartDate) && !bDate.isAfter(prevPeriodEndDate)) {
                    if (isPaidOrDone) {
                        prevPeriodRevenue = prevPeriodRevenue.add(bookingAmt);
                    }
                }
            }
        }

        kpi.setCompletedBookings(completed);
        kpi.setActiveBookings(active);
        kpi.setPendingBookings(pending);
        kpi.setCancelledBookings(cancelled);
        kpi.setTotalRevenue(totalRevenue);

        kpi.setRangeRevenue(rangeRevenue);
        kpi.setRangeBookings(rangeBookingsCount);
        kpi.setRangeCompleted(rangeCompletedCount);

        // Growth rate calculation vs previous period
        double growthRate = 0.0;
        if (prevPeriodRevenue.compareTo(BigDecimal.ZERO) > 0) {
            growthRate = rangeRevenue.subtract(prevPeriodRevenue)
                    .divide(prevPeriodRevenue, 4, java.math.RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .doubleValue();
        } else if (rangeRevenue.compareTo(BigDecimal.ZERO) > 0) {
            growthRate = 100.0;
        }
        kpi.setRevenueGrowthRate(Math.round(growthRate * 100.0) / 100.0);

        // Average Order Value (AOV)
        BigDecimal aov = rangeBookingsCount > 0 
                ? rangeRevenue.divide(BigDecimal.valueOf(rangeBookingsCount), 2, java.math.RoundingMode.HALF_UP)
                : (allBookings.size() > 0 ? totalRevenue.divide(BigDecimal.valueOf(allBookings.size()), 2, java.math.RoundingMode.HALF_UP) : BigDecimal.ZERO);
        kpi.setAverageOrderValue(aov);

        long nonCancelled = allBookings.size() - cancelled;
        double fulfillmentRate = nonCancelled > 0 ? ((double) completed / nonCancelled) * 100.0 : 0.0;
        kpi.setPlatformFulfillmentRate(Math.round(fulfillmentRate * 100.0) / 100.0);

        // 2. Time Series Trends (Last N days or 24 Hours)
        List<AdminAnalyticsResponse.DailyRevenueTrend> revenueTrends;

        if (daysRange == 1) {
            // 24 Hours breakdown by time buckets
            String[] timeBuckets = {"00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "23:59"};
            Map<String, BigDecimal> hourlyRevenueMap = new LinkedHashMap<>();
            Map<String, Long> hourlyCountMap = new LinkedHashMap<>();

            for (String bucket : timeBuckets) {
                hourlyRevenueMap.put(bucket, BigDecimal.ZERO);
                hourlyCountMap.put(bucket, 0L);
            }

            for (Booking b : allBookings) {
                LocalDate bDate = b.getBookingDate();
                if (bDate == null && b.getCreatedAt() != null) {
                    bDate = b.getCreatedAt().toLocalDate();
                }
                if (today.equals(bDate)) {
                    java.time.LocalTime time = b.getStartTime() != null ? b.getStartTime() : (b.getCreatedAt() != null ? b.getCreatedAt().toLocalTime() : java.time.LocalTime.NOON);
                    int hour = time.getHour();
                    String bucket;
                    if (hour < 4) bucket = "00:00";
                    else if (hour < 8) bucket = "04:00";
                    else if (hour < 12) bucket = "08:00";
                    else if (hour < 16) bucket = "12:00";
                    else if (hour < 20) bucket = "16:00";
                    else bucket = "20:00";

                    hourlyCountMap.put(bucket, hourlyCountMap.getOrDefault(bucket, 0L) + 1);
                    if (b.getPaymentStatus() == PaymentStatus.PAID || b.getStatus() == BookingStatus.COMPLETED) {
                        if (b.getFinalAmount() != null) {
                            hourlyRevenueMap.put(bucket, hourlyRevenueMap.getOrDefault(bucket, BigDecimal.ZERO).add(b.getFinalAmount()));
                        }
                    }
                }
            }

            revenueTrends = hourlyRevenueMap.entrySet().stream()
                    .map(entry -> new AdminAnalyticsResponse.DailyRevenueTrend(
                            entry.getKey(),
                            entry.getValue(),
                            hourlyCountMap.getOrDefault(entry.getKey(), 0L)
                    ))
                    .collect(Collectors.toList());
        } else {
            LocalDate startDate = LocalDate.now().minusDays(daysRange - 1);
            Map<LocalDate, BigDecimal> dailyRevenueMap = new LinkedHashMap<>();
            Map<LocalDate, Long> dailyCountMap = new LinkedHashMap<>();

            for (int i = 0; i < daysRange; i++) {
                LocalDate d = startDate.plusDays(i);
                dailyRevenueMap.put(d, BigDecimal.ZERO);
                dailyCountMap.put(d, 0L);
            }

            for (Booking b : allBookings) {
                LocalDate bDate = b.getBookingDate();
                if (bDate == null && b.getCreatedAt() != null) {
                    bDate = b.getCreatedAt().toLocalDate();
                }
                if (bDate != null && !bDate.isBefore(startDate) && dailyRevenueMap.containsKey(bDate)) {
                    dailyCountMap.put(bDate, dailyCountMap.get(bDate) + 1);
                    if (b.getPaymentStatus() == PaymentStatus.PAID || b.getStatus() == BookingStatus.COMPLETED) {
                        if (b.getFinalAmount() != null) {
                            dailyRevenueMap.put(bDate, dailyRevenueMap.get(bDate).add(b.getFinalAmount()));
                        }
                    }
                }
            }

            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("MMM dd");
            revenueTrends = dailyRevenueMap.entrySet().stream()
                    .map(entry -> new AdminAnalyticsResponse.DailyRevenueTrend(
                            entry.getKey().format(dateFormatter),
                            entry.getValue(),
                            dailyCountMap.getOrDefault(entry.getKey(), 0L)
                    ))
                    .collect(Collectors.toList());
        }

        // 3. Category Breakdown
        Map<String, Long> categoryCountMap = new HashMap<>();
        Map<String, BigDecimal> categoryRevenueMap = new HashMap<>();

        for (Booking b : allBookings) {
            String categoryName = (b.getService() != null && b.getService().getCategory() != null)
                    ? b.getService().getCategory().getName()
                    : "General";

            categoryCountMap.put(categoryName, categoryCountMap.getOrDefault(categoryName, 0L) + 1);
            if (b.getPaymentStatus() == PaymentStatus.PAID || b.getStatus() == BookingStatus.COMPLETED) {
                BigDecimal amt = b.getFinalAmount() != null ? b.getFinalAmount() : BigDecimal.ZERO;
                categoryRevenueMap.put(categoryName, categoryRevenueMap.getOrDefault(categoryName, BigDecimal.ZERO).add(amt));
            }
        }

        List<AdminAnalyticsResponse.CategoryBreakdown> categoryDistribution = categoryCountMap.entrySet().stream()
                .map(e -> new AdminAnalyticsResponse.CategoryBreakdown(
                        e.getKey(),
                        e.getValue(),
                        categoryRevenueMap.getOrDefault(e.getKey(), BigDecimal.ZERO)
                ))
                .sorted((a, b) -> Long.compare(b.getBookingCount(), a.getBookingCount()))
                .collect(Collectors.toList());

        // 4. Status Breakdown List
        List<AdminAnalyticsResponse.StatusCount> statusBreakdown = statusCounts.entrySet().stream()
                .map(e -> new AdminAnalyticsResponse.StatusCount(e.getKey(), e.getValue()))
                .collect(Collectors.toList());

        // 5. System Telemetry
        AdminAnalyticsResponse.SystemTelemetry telemetry = new AdminAnalyticsResponse.SystemTelemetry();
        Runtime runtime = Runtime.getRuntime();
        long totalMemory = runtime.totalMemory();
        long freeMemory = runtime.freeMemory();
        long usedMemoryMb = (totalMemory - freeMemory) / (1024 * 1024);
        long maxMemoryMb = runtime.maxMemory() / (1024 * 1024);

        telemetry.setStatus("HEALTHY");
        telemetry.setUptimeSeconds(ManagementFactory.getRuntimeMXBean().getUptime() / 1000);
        telemetry.setHeapUsedMb(usedMemoryMb);
        telemetry.setHeapMaxMb(maxMemoryMb);
        telemetry.setAvailableProcessors(runtime.availableProcessors());
        telemetry.setJvmVersion(System.getProperty("java.version"));
        telemetry.setSystemTime(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));

        return new AdminAnalyticsResponse(kpi, revenueTrends, categoryDistribution, statusBreakdown, telemetry);
    }
}
