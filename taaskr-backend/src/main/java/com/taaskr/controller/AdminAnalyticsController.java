package com.taaskr.controller;

import com.taaskr.dto.admin.analytics.AdminAnalyticsResponse;
import com.taaskr.service.AdminAnalyticsService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/analytics")
@PreAuthorize("hasRole('ADMIN')")
public class AdminAnalyticsController {

    private final AdminAnalyticsService adminAnalyticsService;

    public AdminAnalyticsController(AdminAnalyticsService adminAnalyticsService) {
        this.adminAnalyticsService = adminAnalyticsService;
    }

    @GetMapping("/overview")
    public AdminAnalyticsResponse getOverview(
            @RequestParam(name = "days", defaultValue = "30") int daysRange) {
        return adminAnalyticsService.getPlatformAnalytics(daysRange);
    }
}
