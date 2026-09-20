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

        if (booking.getStatus() == com.taaskr.enums.BookingStatus.COMPLETED || booking.getStatus() == com.taaskr.enums.BookingStatus.CANCELLED) {
            throw new com.taaskr.exception.BadRequestException("Cannot reassign provider for a " + booking.getStatus().name().toLowerCase() + " booking");
        }

        ProviderProfile provider = providerProfileRepository.findById(providerId)
                .orElseThrow(() -> new com.taaskr.exception.ResourceNotFoundException("Provider not found"));

        booking.setProvider(provider);
        if (booking.getStatus() == com.taaskr.enums.BookingStatus.PENDING) {
            booking.setStatus(com.taaskr.enums.BookingStatus.ASSIGNED);
        }
        Booking saved = bookingRepository.save(booking);
        return mapToResponse(saved);
    }

    private String extractServiceName(Booking booking) {
        if (booking.getNotes() != null && !booking.getNotes().isBlank()) {
            String notes = booking.getNotes();
            if (notes.startsWith("[Option: ")) {
                int endIdx = notes.indexOf("]");
                if (endIdx != -1) {
                    return notes.substring(9, endIdx).trim();
                }
            }
            if (notes.startsWith("[Quote Request")) {
                int colonIdx = notes.indexOf("]: ");
                if (colonIdx != -1) {
                    String extracted = notes.substring(colonIdx + 3).trim();
                    int pipeIdx = extracted.indexOf(" | ");
                    if (pipeIdx != -1) {
                        extracted = extracted.substring(0, pipeIdx).trim();
                    }
                    if (!extracted.isBlank()) {
                        return extracted;
                    }
                }
            }
        }
        if (booking.getPackageDescription() != null && booking.getPackageDescription().startsWith("Selected Variant: ")) {
            String pd = booking.getPackageDescription();
            int openParen = pd.indexOf("(");
            if (openParen != -1) {
                String variantName = pd.substring("Selected Variant: ".length(), openParen).trim();
                if (booking.getService() != null && !variantName.isBlank()) {
                    return booking.getService().getName() + " (" + variantName + ")";
                }
            }
        }
        return (booking.getService() != null && booking.getService().getName() != null) ? booking.getService().getName() : "";
    }

    private AdminBookingResponse mapToResponse(Booking booking) {

        User user = booking.getUser();
        Service service = booking.getService();
        ProviderProfile provider = booking.getProvider();

        AdminBookingResponse resp = new AdminBookingResponse(
                booking.getId(),
                booking.getBookingCode(),

                user.getId(),
                user.getName(),
                user.getPhone(),

                provider != null ? provider.getId() : null,
                provider != null ? provider.getUser().getName() : null,

                service.getId(),
                extractServiceName(booking),
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

        if (booking.getServicePartner() != null) {
            resp.setServicePartnerId(booking.getServicePartner().getId());
            resp.setServicePartnerName(booking.getServicePartner().getName());
            resp.setServicePartnerPhone(booking.getServicePartner().getPhone());
        }
        resp.setWorkStartedAt(booking.getWorkStartedAt());

        return resp;
    }
}