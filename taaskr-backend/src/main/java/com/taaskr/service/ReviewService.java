package com.taaskr.service;

import com.taaskr.dto.common.PageResponse;
import com.taaskr.dto.review.CreateReviewRequest;
import com.taaskr.dto.review.ReplyReviewRequest;
import com.taaskr.dto.review.ReviewResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ReviewService {
    ReviewResponse createReview(CreateReviewRequest request, String userEmail);
    ReviewResponse replyToReview(Long reviewId, ReplyReviewRequest request, String providerEmail);
    List<ReviewResponse> getReviewsByService(Long serviceId);
    PageResponse<ReviewResponse> getReviewsByService(Long serviceId, Pageable pageable);
    List<ReviewResponse> getReviewsByProvider(Long providerId);
    PageResponse<ReviewResponse> getReviewsByProvider(Long providerId, Pageable pageable);
    List<ReviewResponse> getMyReviews(String userEmail);
    ReviewResponse getReviewByBookingId(Long bookingId);
}
