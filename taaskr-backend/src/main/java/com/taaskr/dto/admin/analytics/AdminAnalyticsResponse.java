package com.taaskr.dto.admin.analytics;

import java.math.BigDecimal;
import java.util.List;

public class AdminAnalyticsResponse {

    private KpiSummary kpiSummary;
    private List<DailyRevenueTrend> revenueTrends;
    private List<CategoryBreakdown> categoryDistribution;
    private List<StatusCount> statusBreakdown;
    private SystemTelemetry telemetry;

    public AdminAnalyticsResponse() {
    }

    public AdminAnalyticsResponse(KpiSummary kpiSummary,
                                  List<DailyRevenueTrend> revenueTrends,
                                  List<CategoryBreakdown> categoryDistribution,
                                  List<StatusCount> statusBreakdown,
                                  SystemTelemetry telemetry) {
        this.kpiSummary = kpiSummary;
        this.revenueTrends = revenueTrends;
        this.categoryDistribution = categoryDistribution;
        this.statusBreakdown = statusBreakdown;
        this.telemetry = telemetry;
    }

    public KpiSummary getKpiSummary() {
        return kpiSummary;
    }

    public void setKpiSummary(KpiSummary kpiSummary) {
        this.kpiSummary = kpiSummary;
    }

    public List<DailyRevenueTrend> getRevenueTrends() {
        return revenueTrends;
    }

    public void setRevenueTrends(List<DailyRevenueTrend> revenueTrends) {
        this.revenueTrends = revenueTrends;
    }

    public List<CategoryBreakdown> getCategoryDistribution() {
        return categoryDistribution;
    }

    public void setCategoryDistribution(List<CategoryBreakdown> categoryDistribution) {
        this.categoryDistribution = categoryDistribution;
    }

    public List<StatusCount> getStatusBreakdown() {
        return statusBreakdown;
    }

    public void setStatusBreakdown(List<StatusCount> statusBreakdown) {
        this.statusBreakdown = statusBreakdown;
    }

    public SystemTelemetry getTelemetry() {
        return telemetry;
    }

    public void setTelemetry(SystemTelemetry telemetry) {
        this.telemetry = telemetry;
    }

    // Nested DTOs
    public static class KpiSummary {
        private BigDecimal totalRevenue;
        private long totalBookings;
        private long completedBookings;
        private long activeBookings;
        private long pendingBookings;
        private long cancelledBookings;
        private long totalUsers;
        private long totalProviders;
        private long pendingProviderApprovals;
        private double platformFulfillmentRate;

        public KpiSummary() {}

        public BigDecimal getTotalRevenue() { return totalRevenue; }
        public void setTotalRevenue(BigDecimal totalRevenue) { this.totalRevenue = totalRevenue; }

        public long getTotalBookings() { return totalBookings; }
        public void setTotalBookings(long totalBookings) { this.totalBookings = totalBookings; }

        public long getCompletedBookings() { return completedBookings; }
        public void setCompletedBookings(long completedBookings) { this.completedBookings = completedBookings; }

        public long getActiveBookings() { return activeBookings; }
        public void setActiveBookings(long activeBookings) { this.activeBookings = activeBookings; }

        public long getPendingBookings() { return pendingBookings; }
        public void setPendingBookings(long pendingBookings) { this.pendingBookings = pendingBookings; }

        public long getCancelledBookings() { return cancelledBookings; }
        public void setCancelledBookings(long cancelledBookings) { this.cancelledBookings = cancelledBookings; }

        public long getTotalUsers() { return totalUsers; }
        public void setTotalUsers(long totalUsers) { this.totalUsers = totalUsers; }

        public long getTotalProviders() { return totalProviders; }
        public void setTotalProviders(long totalProviders) { this.totalProviders = totalProviders; }

        public long getPendingProviderApprovals() { return pendingProviderApprovals; }
        public void setPendingProviderApprovals(long pendingProviderApprovals) { this.pendingProviderApprovals = pendingProviderApprovals; }

        public double getPlatformFulfillmentRate() { return platformFulfillmentRate; }
        public void setPlatformFulfillmentRate(double platformFulfillmentRate) { this.platformFulfillmentRate = platformFulfillmentRate; }
    }

    public static class DailyRevenueTrend {
        private String date;
        private BigDecimal revenue;
        private long bookingsCount;

        public DailyRevenueTrend() {}

        public DailyRevenueTrend(String date, BigDecimal revenue, long bookingsCount) {
            this.date = date;
            this.revenue = revenue;
            this.bookingsCount = bookingsCount;
        }

        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }

        public BigDecimal getRevenue() { return revenue; }
        public void setRevenue(BigDecimal revenue) { this.revenue = revenue; }

        public long getBookingsCount() { return bookingsCount; }
        public void setBookingsCount(long bookingsCount) { this.bookingsCount = bookingsCount; }
    }

    public static class CategoryBreakdown {
        private String categoryName;
        private long bookingCount;
        private BigDecimal revenue;

        public CategoryBreakdown() {}

        public CategoryBreakdown(String categoryName, long bookingCount, BigDecimal revenue) {
            this.categoryName = categoryName;
            this.bookingCount = bookingCount;
            this.revenue = revenue;
        }

        public String getCategoryName() { return categoryName; }
        public void setCategoryName(String categoryName) { this.categoryName = categoryName; }

        public long getBookingCount() { return bookingCount; }
        public void setBookingCount(long bookingCount) { this.bookingCount = bookingCount; }

        public BigDecimal getRevenue() { return revenue; }
        public void setRevenue(BigDecimal revenue) { this.revenue = revenue; }
    }

    public static class StatusCount {
        private String status;
        private long count;

        public StatusCount() {}

        public StatusCount(String status, long count) {
            this.status = status;
            this.count = count;
        }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public long getCount() { return count; }
        public void setCount(long count) { this.count = count; }
    }

    public static class SystemTelemetry {
        private String status;
        private long uptimeSeconds;
        private long heapUsedMb;
        private long heapMaxMb;
        private int availableProcessors;
        private String jvmVersion;
        private String systemTime;

        public SystemTelemetry() {}

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public long getUptimeSeconds() { return uptimeSeconds; }
        public void setUptimeSeconds(long uptimeSeconds) { this.uptimeSeconds = uptimeSeconds; }

        public long getHeapUsedMb() { return heapUsedMb; }
        public void setHeapUsedMb(long heapUsedMb) { this.heapUsedMb = heapUsedMb; }

        public long getHeapMaxMb() { return heapMaxMb; }
        public void setHeapMaxMb(long heapMaxMb) { this.heapMaxMb = heapMaxMb; }

        public int getAvailableProcessors() { return availableProcessors; }
        public void setAvailableProcessors(int availableProcessors) { this.availableProcessors = availableProcessors; }

        public String getJvmVersion() { return jvmVersion; }
        public void setJvmVersion(String jvmVersion) { this.jvmVersion = jvmVersion; }

        public String getSystemTime() { return systemTime; }
        public void setSystemTime(String systemTime) { this.systemTime = systemTime; }
    }
}
