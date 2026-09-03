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

        // 1. KPI Aggregations
        AdminAnalyticsResponse.KpiSummary kpi = new AdminAnalyticsResponse.KpiSummary();
        kpi.setTotalBookings(allBookings.size());
        kpi.setTotalUsers(totalUsers);
        kpi.setTotalProviders(totalProviders);
        kpi.setPendingProviderApprovals(pendingProviderApprovals);

        long completed = 0;
        long active = 0;
        long pending = 0;
        long cancelled = 0;
        BigDecimal totalRevenue = BigDecimal.ZERO;

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
                    case ASSIGNED, ACCEPTED, IN_PROGRESS -> active++;
                    case PENDING -> pending++;
                    case CANCELLED -> cancelled++;
                }
            }

            // Total revenue from completed or paid bookings
            if (b.getPaymentStatus() == PaymentStatus.PAID || b.getStatus() == BookingStatus.COMPLETED) {
                if (b.getFinalAmount() != null) {
                    totalRevenue = totalRevenue.add(b.getFinalAmount());
                }
            }
        }

        kpi.setCompletedBookings(completed);
        kpi.setActiveBookings(active);
        kpi.setPendingBookings(pending);
        kpi.setCancelledBookings(cancelled);
        kpi.setTotalRevenue(totalRevenue);

        long nonCancelled = allBookings.size() - cancelled;
        double fulfillmentRate = nonCancelled > 0 ? ((double) completed / nonCancelled) * 100.0 : 0.0;
        kpi.setPlatformFulfillmentRate(Math.round(fulfillmentRate * 100.0) / 100.0);

        // 2. Daily Trends (Last N days)
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
        List<AdminAnalyticsResponse.DailyRevenueTrend> revenueTrends = dailyRevenueMap.entrySet().stream()
                .map(entry -> new AdminAnalyticsResponse.DailyRevenueTrend(
                        entry.getKey().format(dateFormatter),
                        entry.getValue(),
                        dailyCountMap.getOrDefault(entry.getKey(), 0L)
                ))
                .collect(Collectors.toList());

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
