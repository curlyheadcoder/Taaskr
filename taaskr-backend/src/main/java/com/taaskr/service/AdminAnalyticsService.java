package com.taaskr.service;

import com.taaskr.dto.admin.analytics.AdminAnalyticsResponse;

public interface AdminAnalyticsService {
    AdminAnalyticsResponse getPlatformAnalytics(int daysRange);
}
