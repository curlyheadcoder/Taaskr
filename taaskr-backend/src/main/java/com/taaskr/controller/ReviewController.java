package com.taaskr.controller;

import com.taaskr.dto.review.CreateReviewRequest;
import com.taaskr.dto.review.ReplyReviewRequest;
import com.taaskr.dto.review.ReviewResponse;
import com.taaskr.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ReviewResponse> createReview(@Valid @RequestBody CreateReviewRequest request, Authentication authentication) {
        ReviewResponse created = reviewService.createReview(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/{id}/reply")
    @PreAuthorize("hasRole('PROVIDER')")
    public ReviewResponse replyToReview(@PathVariable Long id, @Valid @RequestBody ReplyReviewRequest request, Authentication authentication) {
        return reviewService.replyToReview(id, request, authentication.getName());
    }

    @GetMapping("/service/{serviceId}")
    public List<ReviewResponse> getReviewsByService(@PathVariable Long serviceId) {
        return reviewService.getReviewsByService(serviceId);
    }

    @GetMapping("/service/{serviceId}/page")
    public com.taaskr.dto.common.PageResponse<ReviewResponse> getReviewsByServicePage(
            @PathVariable Long serviceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));
        return reviewService.getReviewsByService(serviceId, pageable);
    }

    @GetMapping("/provider/{providerId}")
    public List<ReviewResponse> getReviewsByProvider(@PathVariable Long providerId) {
        return reviewService.getReviewsByProvider(providerId);
    }

    @GetMapping("/provider/{providerId}/page")
    public com.taaskr.dto.common.PageResponse<ReviewResponse> getReviewsByProviderPage(
            @PathVariable Long providerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));
        return reviewService.getReviewsByProvider(providerId, pageable);
    }

    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    public List<ReviewResponse> getMyReviews(Authentication authentication) {
        return reviewService.getMyReviews(authentication.getName());
    }

    @GetMapping("/booking/{bookingId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ReviewResponse> getReviewByBookingId(@PathVariable Long bookingId) {
        ReviewResponse res = reviewService.getReviewByBookingId(bookingId);
        if (res == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(res);
    }
}
