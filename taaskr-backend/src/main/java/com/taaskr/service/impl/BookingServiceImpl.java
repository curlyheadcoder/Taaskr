package com.taaskr.service.impl;

import com.taaskr.dto.booking.AvailableProviderResponse;
import com.taaskr.dto.booking.BookingResponse;
import com.taaskr.dto.booking.CreateBookingRequest;
import com.taaskr.entity.*;
import com.taaskr.enums.BookingStatus;
import com.taaskr.enums.PaymentStatus;
import com.taaskr.enums.Role;
import com.taaskr.enums.VehicleType;
import com.taaskr.exception.BadRequestException;
import com.taaskr.exception.ResourceNotFoundException;
import com.taaskr.repository.*;
import com.taaskr.service.*;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class BookingServiceImpl implements BookingService {

    private final UserRepository userRepository;
    private final ServiceRepository serviceRepository;
    private final ProviderServiceRepository providerServiceRepository;
    private final AvailabilitySlotRepository availabilitySlotRepository;
    private final BookingRepository bookingRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final ProviderCategoryRepository providerCategoryRepository;
    private final org.springframework.context.ApplicationEventPublisher eventPublisher;

    private final MapService mapService;
    private final VehiclePricingService vehiclePricingService;
    private final VehicleEligibilityService vehicleEligibilityService;
    private final VehicleDispatchService vehicleDispatchService;

    public BookingServiceImpl(UserRepository userRepository, 
                              ServiceRepository serviceRepository, 
                              ProviderServiceRepository providerServiceRepository, 
                              AvailabilitySlotRepository availabilitySlotRepository, 
                              BookingRepository bookingRepository,
                              ProviderProfileRepository providerProfileRepository,
                              ProviderCategoryRepository providerCategoryRepository,
                              org.springframework.context.ApplicationEventPublisher eventPublisher,
                              MapService mapService,
                              VehiclePricingService vehiclePricingService,
                              VehicleEligibilityService vehicleEligibilityService,
                              VehicleDispatchService vehicleDispatchService) {
        this.userRepository = userRepository;
        this.serviceRepository = serviceRepository;
        this.providerServiceRepository = providerServiceRepository;
        this.availabilitySlotRepository = availabilitySlotRepository;
        this.bookingRepository = bookingRepository;
        this.providerProfileRepository = providerProfileRepository;
        this.providerCategoryRepository = providerCategoryRepository;
        this.eventPublisher = eventPublisher;
        this.mapService = mapService;
        this.vehiclePricingService = vehiclePricingService;
        this.vehicleEligibilityService = vehicleEligibilityService;
        this.vehicleDispatchService = vehicleDispatchService;
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

        if ((request.getLatitude() == null) != (request.getLongitude() == null)) {
            throw new BadRequestException("Both latitude and longitude are required for a map location");
        }

        LocalTime startTime = request.getStartTime();
        LocalTime endTime = startTime.plusMinutes(service.getDurationMinutes());

        if (!endTime.isAfter(startTime)) {
            throw new BadRequestException("Invalid booking time range");
        }

        boolean isVehicleBooking = (service.getCategory() != null && service.getCategory().getName() != null 
                && (service.getCategory().getName().toLowerCase().contains("vehicle") || service.getCategory().getName().toLowerCase().contains("transport")))
                || request.getDropCity() != null || request.getDropAddress() != null;

        BigDecimal calculatedFare = service.getPrice();
        BigDecimal distanceKm = null;
        Vehicle matchedVehicle = null;

        if (isVehicleBooking) {
            if (request.getLatitude() != null && request.getLongitude() != null 
                    && request.getDropLatitude() != null && request.getDropLongitude() != null) {
                distanceKm = mapService.calculateDistanceKm(
                        request.getLatitude(), request.getLongitude(),
                        request.getDropLatitude(), request.getDropLongitude()
                );
            } else {
                distanceKm = mapService.estimateDistanceKm(
                        request.getCity(), request.getPincode(),
                        request.getDropCity(), request.getDropPincode()
                );
            }
            if (request.getDistanceKm() != null && request.getDistanceKm().compareTo(BigDecimal.ZERO) > 0) {
                distanceKm = request.getDistanceKm();
            }

            VehicleType vehicleType = vehicleEligibilityService.determineVehicleTypeFromService(service);
            calculatedFare = vehiclePricingService.calculatePrice(vehicleType, distanceKm);
        }

        ProviderAssignmentResult assignmentResult;

        if (request.getProviderId() != null) {
            ProviderProfile selectedProvider = providerProfileRepository.findById(request.getProviderId())
                    .orElseThrow(() -> new BadRequestException("Selected provider does not exist"));

            if (!Boolean.TRUE.equals(selectedProvider.getApproved()) || !Boolean.TRUE.equals(selectedProvider.getUser().getEnabled())) {
                throw new BadRequestException("Selected provider is not active or approved");
            }

            if (selectedProvider.getUser().getRole() != Role.PROVIDER) {
                throw new BadRequestException("Selected user is not a provider");
            }

            boolean isMapped = providerCategoryRepository.findByProviderId(selectedProvider.getId()).stream()
                    .anyMatch(pc -> pc.getCategory().getId().equals(service.getCategory().getId()));
            if (!isMapped) {
                throw new BadRequestException("Selected provider does not offer the requested service category");
            }

            AvailabilitySlot matchingSlot = findMatchingSlot(selectedProvider, request.getBookingDate(), startTime, endTime);
            if (matchingSlot == null) {
                throw new BadRequestException("Selected provider is not available for the requested time slot");
            }

            boolean hasOverlap = bookingRepository.existsByProviderIdAndBookingDateAndStartTimeLessThanAndEndTimeGreaterThan(
                    selectedProvider.getId(), request.getBookingDate(), endTime, startTime);
            if (hasOverlap) {
                throw new BadRequestException("Selected provider has an overlapping booking");
            }

            assignmentResult = new ProviderAssignmentResult(selectedProvider, matchingSlot);
        } else if (isVehicleBooking) {
            // Attempt vehicle driver dispatch
            VehicleType vehicleType = vehicleEligibilityService.determineVehicleTypeFromService(service);
            var dispatchOpt = vehicleDispatchService.findBestDriverForTrip(
                    vehicleType,
                    request.getCity().trim(),
                    request.getPincode() != null ? request.getPincode().trim() : null,
                    request.getLatitude(),
                    request.getLongitude(),
                    request.getBookingDate(),
                    startTime,
                    endTime
            );

            if (dispatchOpt.isPresent()) {
                assignmentResult = new ProviderAssignmentResult(dispatchOpt.get().provider(), null);
                matchedVehicle = dispatchOpt.get().vehicle();
            } else {
                assignmentResult = new ProviderAssignmentResult(null, null);
            }
        } else {
            assignmentResult = assignProvider(
                    service,
                    request.getCity().trim(),
                    request.getPincode().trim(),
                    request.getBookingDate(),
                    startTime,
                    endTime
            );
        }

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
        booking.setLatitude(request.getLatitude());
        booking.setLongitude(request.getLongitude());

        // Vehicle & Route Fields
        if (isVehicleBooking) {
            booking.setDropAddress(request.getDropAddress() != null ? request.getDropAddress().trim() : request.getAddress().trim());
            booking.setDropCity(request.getDropCity() != null ? request.getDropCity().trim() : request.getCity().trim());
            booking.setDropPincode(request.getDropPincode() != null ? request.getDropPincode().trim() : request.getPincode().trim());
            booking.setDropLatitude(request.getDropLatitude());
            booking.setDropLongitude(request.getDropLongitude());
            booking.setPackageDescription(request.getPackageDescription());
            booking.setPackageWeightKg(request.getPackageWeightKg());
            booking.setDistanceKm(distanceKm);
            booking.setVehicle(matchedVehicle);
        }

        booking.setNotes(request.getNotes());
        booking.setTotalAmount(calculatedFare);
        booking.setDiscountAmount(BigDecimal.ZERO);
        booking.setFinalAmount(calculatedFare);
        booking.setPaymentStatus(PaymentStatus.PENDING);
        booking.setPaymentMethod(request.getPaymentMethod());
        booking.setStatus(assignmentResult.provider() != null ? BookingStatus.ASSIGNED : BookingStatus.PENDING);

        Booking savedBooking = bookingRepository.save(booking);

        if (assignmentResult.slot() != null) {
            assignmentResult.slot().setBooked(true);
            availabilitySlotRepository.save(assignmentResult.slot());
        } else if (assignmentResult.provider() != null) {
            AvailabilitySlot newSlot = new AvailabilitySlot();
            newSlot.setProvider(assignmentResult.provider());
            newSlot.setAvailableDate(request.getBookingDate());
            newSlot.setStartTime(startTime);
            newSlot.setEndTime(endTime);
            newSlot.setBooked(true);
            availabilitySlotRepository.save(newSlot);
        }

        // Publish asynchronous domain event
        eventPublisher.publishEvent(new com.taaskr.event.BookingCreatedEvent(
                savedBooking.getId(),
                user.getId(),
                user.getEmail(),
                service.getId(),
                service.getName()
        ));

        return mapBooking(savedBooking);
    }

    @Override
    @Transactional
    public List<BookingResponse> getMyBookings(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return bookingRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::mapBooking)
                .toList();
    }

    @Override
    @Transactional
    public BookingResponse getMyBookingById(String userEmail, Long bookingId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Booking booking = bookingRepository.findByIdAndUserId(bookingId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        return mapBooking(booking);
    }

    @Override
    @Transactional
    public BookingResponse rateBooking(String userEmail, Long bookingId, com.taaskr.dto.booking.RateBookingRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Booking booking = bookingRepository.findByIdAndUserId(bookingId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        if (booking.getStatus() != com.taaskr.enums.BookingStatus.COMPLETED) {
            throw new IllegalStateException("You can only rate a completed booking.");
        }

        if (booking.getRating() != null) {
            throw new IllegalStateException("Booking has already been rated.");
        }

        booking.setRating(request.getRating());
        booking.setReview(request.getReview());

        ProviderProfile provider = booking.getProvider();
        if (provider != null) {
            int currentTotalRatings = provider.getTotalRatings() != null ? provider.getTotalRatings() : 0;
            double currentAverage = provider.getRating() != null ? provider.getRating() : 0.0;
            
            double newAverage = ((currentAverage * currentTotalRatings) + request.getRating()) / (currentTotalRatings + 1);
            
            provider.setTotalRatings(currentTotalRatings + 1);
            provider.setRating(newAverage);
        }

        return mapBooking(booking);
    }

    @Override
    @Transactional
    public BookingResponse cancelMyBooking(String userEmail, Long bookingId, String reason) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Booking booking = bookingRepository.findByIdAndUserId(bookingId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        if (booking.getStatus() == BookingStatus.COMPLETED || booking.getStatus() == BookingStatus.CANCELLED) {
            throw new BadRequestException("Booking cannot be cancelled in its current state: " + booking.getStatus());
        }

        BookingStatus previousStatus = booking.getStatus();
        booking.setStatus(BookingStatus.CANCELLED);
        if (reason != null && !reason.isBlank()) {
            booking.setNotes(booking.getNotes() != null ? booking.getNotes() + " [Cancelled: " + reason + "]" : "[Cancelled: " + reason + "]");
        }

        bookingRepository.save(booking);

        Long providerId = booking.getProvider() != null ? booking.getProvider().getId() : null;
        eventPublisher.publishEvent(new com.taaskr.event.BookingStatusChangedEvent(
                booking.getId(),
                previousStatus,
                BookingStatus.CANCELLED,
                providerId
        ));

        return mapBooking(booking);
    }

    @Override
    public List<AvailableProviderResponse> getAvailableProviders(Long serviceId, String city, String pincode, LocalDate date, LocalTime startTime) {
        com.taaskr.entity.Service service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new ResourceNotFoundException("Service not found"));
        
        LocalTime endTime = startTime.plusMinutes(service.getDurationMinutes());
        
        List<com.taaskr.entity.ProviderCategory> providerCategories = providerCategoryRepository.findByCategoryId(service.getCategory().getId());

        List<ProviderProfile> candidateProviders = providerCategories.stream()
                .map(com.taaskr.entity.ProviderCategory::getProvider)
                .filter(provider -> Boolean.TRUE.equals(provider.getApproved()) && Boolean.TRUE.equals(provider.getUser().getEnabled()))
                .filter(provider -> provider.getUser().getRole() == Role.PROVIDER)
                .distinct()
                .toList();
                
        // Filter those who have no overlapping bookings
        List<ProviderProfile> availableProviders = candidateProviders.stream()
                .filter(provider -> {
                    boolean hasOverlap = bookingRepository.existsByProviderIdAndBookingDateAndStartTimeLessThanAndEndTimeGreaterThan(
                            provider.getId(), date, endTime, startTime);
                    return !hasOverlap;
                })
                .toList();
                
        // Sort by location preference: Pincode match first, then City match, then rest
        return availableProviders.stream()
                .sorted(Comparator.<ProviderProfile, Integer>comparing(p -> {
                    if (pincode != null && pincode.equalsIgnoreCase(safe(p.getPincode()))) return 0;
                    if (city != null && city.equalsIgnoreCase(safe(p.getCity()))) return 1;
                    return 2;
                }).thenComparing(ProviderProfile::getRating, Comparator.reverseOrder()))
                .map(p -> new AvailableProviderResponse(
                        p.getId(),
                        p.getUser().getName(),
                        p.getRating(),
                        p.getExperienceYears(),
                        p.getCity(),
                        p.getPincode(),
                        p.getBio()
                ))
                .collect(Collectors.toList());
    }

    private ProviderAssignmentResult assignProvider(com.taaskr.entity.Service service,
                                                    String city,
                                                    String pincode,
                                                    LocalDate bookingDate,
                                                    LocalTime startTime,
                                                    LocalTime endTime) {

        List<com.taaskr.entity.ProviderCategory> providerCategories = providerCategoryRepository.findByCategoryId(service.getCategory().getId());

        List<ProviderProfile> candidateProviders = providerCategories.stream()
                .map(com.taaskr.entity.ProviderCategory::getProvider)
                .filter(provider -> Boolean.TRUE.equals(provider.getApproved()) && Boolean.TRUE.equals(provider.getUser().getEnabled()))
                .filter(provider -> provider.getUser().getRole() == Role.PROVIDER)
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

                    AvailabilitySlot slot = findMatchingSlot(provider, bookingDate, startTime, endTime);

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
                .filter(slot -> !slot.getStartTime().isAfter(startTime) && slot.getEndTime().isAfter(startTime))
                .findFirst()
                .orElse(null);
    }

    private BookingResponse mapBooking(Booking booking) {
        ProviderProfile provider = booking.getProvider();
        Vehicle vehicle = booking.getVehicle();

        BookingResponse response = new BookingResponse(
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
                booking.getLatitude(),
                booking.getLongitude(),
                booking.getStatus(),
                booking.getTotalAmount(),
                booking.getDiscountAmount(),
                booking.getFinalAmount(),
                booking.getPaymentStatus(),
                booking.getPaymentMethod(),
                booking.getNotes(),
                booking.getRating(),
                booking.getReview(),
                booking.getCreatedAt(),
                booking.getUpdatedAt()
        );

        response.setDropAddress(booking.getDropAddress());
        response.setDropCity(booking.getDropCity());
        response.setDropPincode(booking.getDropPincode());
        response.setDropLatitude(booking.getDropLatitude());
        response.setDropLongitude(booking.getDropLongitude());
        response.setPackageDescription(booking.getPackageDescription());
        response.setPackageWeightKg(booking.getPackageWeightKg());
        response.setDistanceKm(booking.getDistanceKm());

        if (vehicle != null) {
            response.setVehicleType(vehicle.getVehicleType());
            response.setVehicleModel(vehicle.getModelName());
            response.setVehicleRegistrationNumber(vehicle.getRegistrationNumber());
        }

        return response;
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
