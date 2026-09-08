package com.taaskr.service.impl;

import com.taaskr.dto.review.CreateReviewRequest;
import com.taaskr.dto.review.ReplyReviewRequest;
import com.taaskr.dto.review.ReviewResponse;
import com.taaskr.entity.*;
import com.taaskr.enums.BookingStatus;
import com.taaskr.enums.NotificationType;
import com.taaskr.repository.*;
import com.taaskr.service.NotificationService;
import com.taaskr.service.ReviewService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final NotificationService notificationService;

    public ReviewServiceImpl(ReviewRepository reviewRepository,
                             BookingRepository bookingRepository,
                             UserRepository userRepository,
                             ProviderProfileRepository providerProfileRepository,
                             NotificationService notificationService) {
        this.reviewRepository = reviewRepository;
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.providerProfileRepository = providerProfileRepository;
        this.notificationService = notificationService;
    }

    private ReviewResponse mapToResponse(Review review) {
        ReviewResponse res = new ReviewResponse();
        res.setId(review.getId());
        if (review.getBooking() != null) {
            res.setBookingId(review.getBooking().getId());
            res.setBookingCode(review.getBooking().getBookingCode());
        }
        if (review.getUser() != null) {
            res.setUserId(review.getUser().getId());
            res.setUserName(review.getUser().getFullName());
        }
        if (review.getProvider() != null) {
            res.setProviderId(review.getProvider().getId());
            res.setProviderName(review.getProvider().getUser() != null ? review.getProvider().getUser().getFullName() : "Provider");
        }
        if (review.getService() != null) {
            res.setServiceId(review.getService().getId());
            res.setServiceName(review.getService().getName());
        }
        res.setRating(review.getRating());
        res.setQualityRating(review.getQualityRating());
        res.setPunctualityRating(review.getPunctualityRating());
        res.setComment(review.getComment());
        res.setProviderReply(review.getProviderReply());
        res.setRepliedAt(review.getRepliedAt());
        res.setCreatedAt(review.getCreatedAt());
        return res;
    }

    @Override
    public ReviewResponse createReview(CreateReviewRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));

        if (!booking.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only review your own bookings");
        }

        if (booking.getStatus() != BookingStatus.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Review can only be submitted for completed bookings");
        }

        if (reviewRepository.existsByBookingId(booking.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Review has already been submitted for this booking");
        }

        Review review = new Review();
        review.setBooking(booking);
        review.setUser(user);
        review.setService(booking.getService());
        review.setRating(request.getRating());
        review.setQualityRating(request.getQualityRating());
        review.setPunctualityRating(request.getPunctualityRating());
        review.setComment(request.getComment());

        if (booking.getProvider() != null) {
            review.setProvider(booking.getProvider());

            // Recalculate provider rating
            ProviderProfile provider = booking.getProvider();
            int currentRatings = provider.getTotalRatings() != null ? provider.getTotalRatings() : 0;
            double currentRating = provider.getRating() != null ? provider.getRating() : 0.0;
            double newRating = ((currentRating * currentRatings) + request.getRating()) / (currentRatings + 1);
            provider.setRating(Math.round(newRating * 10.0) / 10.0);
            provider.setTotalRatings(currentRatings + 1);
            providerProfileRepository.save(provider);

            // Notify provider
            if (provider.getUser() != null) {
                notificationService.sendNotification(
                        provider.getUser(),
                        "New Customer Review",
                        user.getFullName() + " left a " + request.getRating() + "-star rating on booking #" + booking.getBookingCode(),
                        NotificationType.INFO,
                        "BOOKING",
                        booking.getId()
                );
            }
        }

        Review saved = reviewRepository.save(review);
        return mapToResponse(saved);
    }

    @Override
    public ReviewResponse replyToReview(Long reviewId, ReplyReviewRequest request, String providerEmail) {
        User user = userRepository.findByEmail(providerEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        ProviderProfile provider = providerProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Only providers can reply to reviews"));

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found"));

        if (review.getProvider() == null || !review.getProvider().getId().equals(provider.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only reply to reviews for your services");
        }

        review.setProviderReply(request.getReply());
        review.setRepliedAt(LocalDateTime.now());
        Review saved = reviewRepository.save(review);

        // Notify customer
        if (review.getUser() != null) {
            notificationService.sendNotification(
                    review.getUser(),
                    "Provider Replied to Your Review",
                    user.getFullName() + " replied to your review on booking #" + (review.getBooking() != null ? review.getBooking().getBookingCode() : ""),
                    NotificationType.INFO,
                    "REVIEW",
                    review.getId()
            );
        }

        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewResponse> getReviewsByService(Long serviceId) {
        return reviewRepository.findByServiceIdOrderByCreatedAtDesc(serviceId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public com.taaskr.dto.common.PageResponse<ReviewResponse> getReviewsByService(Long serviceId, org.springframework.data.domain.Pageable pageable) {
        org.springframework.data.domain.Page<Review> page = reviewRepository.findByServiceId(serviceId, pageable);
        return com.taaskr.dto.common.PageResponse.of(page, this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewResponse> getReviewsByProvider(Long providerId) {
        return reviewRepository.findByProviderIdOrderByCreatedAtDesc(providerId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public com.taaskr.dto.common.PageResponse<ReviewResponse> getReviewsByProvider(Long providerId, org.springframework.data.domain.Pageable pageable) {
        org.springframework.data.domain.Page<Review> page = reviewRepository.findByProviderId(providerId, pageable);
        return com.taaskr.dto.common.PageResponse.of(page, this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewResponse> getMyReviews(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return reviewRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ReviewResponse getReviewByBookingId(Long bookingId) {
        return reviewRepository.findByBookingId(bookingId)
                .map(this::mapToResponse)
                .orElse(null);
    }
}
