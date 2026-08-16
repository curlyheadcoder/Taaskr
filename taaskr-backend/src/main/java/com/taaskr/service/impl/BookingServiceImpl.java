package com.taaskr.service.impl;

import com.taaskr.dto.booking.BookingResponse;
import com.taaskr.dto.booking.CreateBookingRequest;
import com.taaskr.entity.*;
import com.taaskr.enums.BookingStatus;
import com.taaskr.enums.PaymentStatus;
import com.taaskr.exception.BadRequestException;
import com.taaskr.exception.ResourceNotFoundException;
import com.taaskr.repository.*;
import com.taaskr.service.BookingService;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
public class BookingServiceImpl implements BookingService {

    private final UserRepository userRepository;
    private final ServiceRepository serviceRepository;
    private final ProviderServiceRepository providerServiceRepository;
    private final AvailabilitySlotRepository availabilitySlotRepository;
    private final BookingRepository bookingRepository;

    public BookingServiceImpl(UserRepository userRepository, ServiceRepository serviceRepository, ProviderServiceRepository providerServiceRepository, AvailabilitySlotRepository availabilitySlotRepository, BookingRepository bookingRepository) {
        this.userRepository = userRepository;
        this.serviceRepository = serviceRepository;
        this.providerServiceRepository = providerServiceRepository;
        this.availabilitySlotRepository = availabilitySlotRepository;
        this.bookingRepository = bookingRepository;
    }
    @Override
    @Transactional
    public BookingResponse createBooking(String userEmail, CreateBookingRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        com.taaskr.entity.Service service = serviceRepository.findById(request.getServiceId())
                .orElseThrow(() -> new ResourceNotFoundException("Service not found"));

        if (!Boolean.TRUE.equals(service.getActive())) {
            throw new BadRequestException("Selected service is not active");
        }

        if (request.getBookingDate().isBefore(LocalDate.now())) {
            throw new BadRequestException("Booking date cannot be in the past");
        }

        LocalTime startTime = request.getStartTime();
        LocalTime endTime = startTime.plusMinutes(service.getDurationMinutes());

        if (!endTime.isAfter(startTime)) {
            throw new BadRequestException("Invalid booking time range");
        }

        ProviderAssignmentResult assignmentResult = assignProvider(
                service,
                request.getCity().trim(),
                request.getPincode().trim(),
                request.getBookingDate(),
                startTime,
                endTime
        );

        Booking booking = new Booking();
        booking.setBookingCode(generateBookingCode());
        booking.setUser(user);
        booking.setService(service);
        booking.setProvider(assignmentResult.provider());
        booking.setBookingDate(request.getBookingDate());
        booking.setStartTime(startTime);
        booking.setEndTime(endTime);
        booking.setAddress(request.getAddress().trim());
        booking.setCity(request.getCity().trim());
        booking.setPincode(request.getPincode().trim());
        booking.setNotes(request.getNotes());
        booking.setTotalAmount(service.getPrice());
        booking.setDiscountAmount(BigDecimal.ZERO);
        booking.setFinalAmount(service.getPrice());
        booking.setPaymentStatus(PaymentStatus.PENDING);
        booking.setStatus(assignmentResult.provider() != null ? BookingStatus.ASSIGNED : BookingStatus.PENDING);

        Booking savedBooking = bookingRepository.save(booking);

        if (assignmentResult.slot() != null) {
            assignmentResult.slot().setBooked(true);
            availabilitySlotRepository.save(assignmentResult.slot());
        }

        return mapBooking(savedBooking);
    }

    @Override
    public List<BookingResponse> getMyBookings(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return bookingRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::mapBooking)
                .toList();
    }

    @Override
    public BookingResponse getMyBookingById(String userEmail, Long bookingId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Booking booking = bookingRepository.findByIdAndUserId(bookingId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        return mapBooking(booking);
    }

    private ProviderAssignmentResult assignProvider(com.taaskr.entity.Service service,
                                                    String city,
                                                    String pincode,
                                                    LocalDate bookingDate,
                                                    LocalTime startTime,
                                                    LocalTime endTime) {

        List<ProviderService> providerServices = providerServiceRepository.findByServiceId(service.getId());

        List<ProviderProfile> candidateProviders = providerServices.stream()
                .map(ProviderService::getProvider)
                .filter(provider -> Boolean.TRUE.equals(provider.getApproved()))
                .distinct()
                .toList();

        List<ProviderProfile> exactPincodeMatches = candidateProviders.stream()
                .filter(provider -> pincode.equalsIgnoreCase(safe(provider.getPincode())))
                .toList();

        ProviderAssignmentResult exactResult = findBestProviderWithSlot(exactPincodeMatches, bookingDate, startTime, endTime);
        if (exactResult.provider() != null) {
            return exactResult;
        }

        List<ProviderProfile> cityMatches = candidateProviders.stream()
                .filter(provider -> city.equalsIgnoreCase(safe(provider.getCity())))
                .toList();

        return findBestProviderWithSlot(cityMatches, bookingDate, startTime, endTime);
    }

    private ProviderAssignmentResult findBestProviderWithSlot(List<ProviderProfile> providers,
                                                              LocalDate bookingDate,
                                                              LocalTime startTime,
                                                              LocalTime endTime) {
        return providers.stream()
                .map(provider -> {
                    AvailabilitySlot slot = findMatchingSlot(provider, bookingDate, startTime, endTime);
                    if (slot == null) {
                        return null;
                    }

                    boolean overlappingBookingExists =
                            bookingRepository.existsByProviderIdAndBookingDateAndStartTimeLessThanAndEndTimeGreaterThan(
                                    provider.getId(),
                                    bookingDate,
                                    endTime,
                                    startTime
                            );

                    if (overlappingBookingExists) {
                        return null;
                    }

                    long workload = bookingRepository.countByProviderIdAndStatusIn(
                            provider.getId(),
                            List.of(BookingStatus.ASSIGNED, BookingStatus.ACCEPTED, BookingStatus.IN_PROGRESS)
                    );

                    return new ProviderCandidate(provider, slot, workload);
                })
                .filter(candidate -> candidate != null)
                .sorted(
                        Comparator.comparingLong(ProviderCandidate::workload)
                                .thenComparing((ProviderCandidate c) -> c.provider().getRating(), Comparator.reverseOrder())
                                .thenComparing(c -> c.provider().getId())
                )
                .findFirst()
                .map(candidate -> new ProviderAssignmentResult(candidate.provider(), candidate.slot()))
                .orElse(new ProviderAssignmentResult(null, null));
    }

    private AvailabilitySlot findMatchingSlot(ProviderProfile provider,
                                              LocalDate bookingDate,
                                              LocalTime startTime,
                                              LocalTime endTime) {
        List<AvailabilitySlot> slots = availabilitySlotRepository
                .findByProviderIdAndAvailableDateAndBookedFalseOrderByStartTimeAsc(provider.getId(), bookingDate);

        return slots.stream()
                .filter(slot -> !slot.getStartTime().isAfter(startTime) && !slot.getEndTime().isBefore(endTime))
                .findFirst()
                .orElse(null);
    }

    private BookingResponse mapBooking(Booking booking) {
        ProviderProfile provider = booking.getProvider();

        return new BookingResponse(
                booking.getId(),
                booking.getBookingCode(),
                booking.getService().getId(),
                booking.getService().getName(),
                booking.getService().getCategory().getId(),
                booking.getService().getCategory().getName(),
                booking.getUser().getId(),
                booking.getUser().getName(),
                provider != null ? provider.getId() : null,
                provider != null ? provider.getUser().getName() : null,
                provider != null,
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

    private String generateBookingCode() {
        return "TSK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private String safe(String value) {
        return value == null ? "" : value.trim();
    }

    private record ProviderAssignmentResult(ProviderProfile provider, AvailabilitySlot slot) {}
    private record ProviderCandidate(ProviderProfile provider, AvailabilitySlot slot, long workload) {}
}
