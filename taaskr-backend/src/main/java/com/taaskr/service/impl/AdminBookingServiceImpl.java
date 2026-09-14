package com.taaskr.service.impl;

import com.taaskr.dto.admin.AdminBookingResponse;
import com.taaskr.entity.Booking;
import com.taaskr.entity.ProviderProfile;
import com.taaskr.entity.Service;
import com.taaskr.entity.User;
import com.taaskr.repository.BookingRepository;
import com.taaskr.service.AdminBookingService;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@org.springframework.stereotype.Service
public class AdminBookingServiceImpl implements AdminBookingService {

    private final BookingRepository bookingRepository;
    private final com.taaskr.repository.ProviderProfileRepository providerProfileRepository;

    public AdminBookingServiceImpl(BookingRepository bookingRepository,
                                  com.taaskr.repository.ProviderProfileRepository providerProfileRepository) {
        this.bookingRepository = bookingRepository;
        this.providerProfileRepository = providerProfileRepository;
    }

    @Transactional(readOnly = true)
    @Override
    public List<AdminBookingResponse> getAllBookings() {

        return bookingRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    @Override
    public com.taaskr.dto.common.PageResponse<AdminBookingResponse> getAllBookings(org.springframework.data.domain.Pageable pageable) {
        org.springframework.data.domain.Page<Booking> page = bookingRepository.findAll(pageable);
        return com.taaskr.dto.common.PageResponse.of(page, this::mapToResponse);
    }

    @Transactional
    @Override
    public AdminBookingResponse assignProviderToBooking(Long bookingId, Long providerId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new com.taaskr.exception.ResourceNotFoundException("Booking not found"));
        ProviderProfile provider = providerProfileRepository.findById(providerId)
                .orElseThrow(() -> new com.taaskr.exception.ResourceNotFoundException("Provider not found"));

        booking.setProvider(provider);
        if (booking.getStatus() == com.taaskr.enums.BookingStatus.PENDING) {
            booking.setStatus(com.taaskr.enums.BookingStatus.ASSIGNED);
        }
        Booking saved = bookingRepository.save(booking);
        return mapToResponse(saved);
    }

    private AdminBookingResponse mapToResponse(Booking booking) {

        User user = booking.getUser();
        Service service = booking.getService();
        ProviderProfile provider = booking.getProvider();

        return new AdminBookingResponse(
                booking.getId(),
                booking.getBookingCode(),

                user.getId(),
                user.getName(),
                user.getPhone(),

                provider != null ? provider.getId() : null,
                provider != null ? provider.getUser().getName() : null,

                service.getId(),
                service.getName(),
                service.getCategory().getName(),

                booking.getBookingDate(),
                booking.getStartTime(),
                booking.getEndTime(),

                booking.getAddress(),
                booking.getCity(),
                booking.getPincode(),

                booking.getStatus(),

                booking.getTotalAmount(),
                booking.getDiscountAmount(),
                booking.getFinalAmount(),

                booking.getPaymentStatus(),

                booking.getNotes(),

                booking.getCreatedAt(),
                booking.getUpdatedAt()
        );
    }
}