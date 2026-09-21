package com.taaskr.service.impl;

import com.taaskr.dto.booking.BookingResponse;
import com.taaskr.dto.partner.*;
import com.taaskr.entity.Booking;
import com.taaskr.entity.ProviderProfile;
import com.taaskr.entity.ServicePartner;
import com.taaskr.entity.User;
import com.taaskr.enums.BookingStatus;
import com.taaskr.enums.PaymentMethod;
import com.taaskr.enums.PaymentStatus;
import com.taaskr.enums.Role;
import com.taaskr.exception.BadRequestException;
import com.taaskr.exception.ResourceNotFoundException;
import com.taaskr.repository.BookingRepository;
import com.taaskr.repository.ProviderProfileRepository;
import com.taaskr.repository.ServicePartnerRepository;
import com.taaskr.repository.UserRepository;
import com.taaskr.dto.routing.RoutingResult;
import com.taaskr.service.MapService;
import com.taaskr.service.RoutingService;
import com.taaskr.service.ServicePartnerService;
import jakarta.transaction.Transactional;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ServicePartnerServiceImpl implements ServicePartnerService {

    private final UserRepository userRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final ServicePartnerRepository servicePartnerRepository;
    private final BookingRepository bookingRepository;
    private final PasswordEncoder passwordEncoder;
    private final MapService mapService;
    private final RoutingService routingService;
    private final SimpMessagingTemplate messagingTemplate;

    public ServicePartnerServiceImpl(UserRepository userRepository,
                                     ProviderProfileRepository providerProfileRepository,
                                     ServicePartnerRepository servicePartnerRepository,
                                     BookingRepository bookingRepository,
                                     PasswordEncoder passwordEncoder,
                                     MapService mapService,
                                     RoutingService routingService,
                                     SimpMessagingTemplate messagingTemplate) {
        this.userRepository = userRepository;
        this.providerProfileRepository = providerProfileRepository;
        this.servicePartnerRepository = servicePartnerRepository;
        this.bookingRepository = bookingRepository;
        this.passwordEncoder = passwordEncoder;
        this.mapService = mapService;
        this.routingService = routingService;
        this.messagingTemplate = messagingTemplate;
    }

    @Override
    @Transactional
    public ServicePartnerResponse createServicePartner(String providerEmail, CreateServicePartnerRequest request) {
        User providerUser = userRepository.findByEmail(providerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Provider user not found"));

        ProviderProfile provider = providerProfileRepository.findByUserId(providerUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Provider profile not found"));

        String workerEmail = request.getEmail() != null && !request.getEmail().isBlank()
                ? request.getEmail().trim().toLowerCase()
                : "partner." + System.currentTimeMillis() + "@taaskr.com";

        if (userRepository.existsByEmail(workerEmail)) {
            throw new BadRequestException("An account with email " + workerEmail + " already exists");
        }

        User workerUser = new User();
        workerUser.setName(request.getName().trim());
        workerUser.setEmail(workerEmail);
        workerUser.setPhone(request.getPhone().trim());
        workerUser.setPassword(passwordEncoder.encode(request.getPassword()));
        workerUser.setRole(Role.SERVICE_PARTNER);
        workerUser.setCity(provider.getCity() != null ? provider.getCity() : providerUser.getCity());
        workerUser.setPincode(provider.getPincode() != null ? provider.getPincode() : providerUser.getPincode());
        workerUser.setEmailVerified(true);
        workerUser.setPhoneVerified(true);
        workerUser = userRepository.save(workerUser);

        ServicePartner partner = new ServicePartner();
        partner.setProvider(provider);
        partner.setUser(workerUser);
        partner.setName(request.getName().trim());
        partner.setPhone(request.getPhone().trim());
        partner.setEmail(workerEmail);
        partner.setTitle(request.getTitle() != null ? request.getTitle().trim() : "Service Partner");
        partner.setExperience(request.getExperience() != null ? request.getExperience().trim() : "2+ Years");
        partner.setRating(5.0);
        partner.setActive(true);
        partner = servicePartnerRepository.save(partner);

        return mapToPartnerResponse(partner);
    }

    @Override
    @Transactional
    public List<ServicePartnerResponse> getProviderPartners(String providerEmail) {
        User providerUser = userRepository.findByEmail(providerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Provider user not found"));

        ProviderProfile provider = providerProfileRepository.findByUserId(providerUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Provider profile not found"));

        return servicePartnerRepository.findByProviderId(provider.getId())
                .stream()
                .map(this::mapToPartnerResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ServicePartnerResponse togglePartnerStatus(String providerEmail, Long partnerId, Boolean active) {
        User providerUser = userRepository.findByEmail(providerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Provider user not found"));

        ProviderProfile provider = providerProfileRepository.findByUserId(providerUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Provider profile not found"));

        ServicePartner partner = servicePartnerRepository.findByIdAndProviderId(partnerId, provider.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Service partner not found"));

        partner.setActive(active != null ? active : !partner.getActive());
        partner = servicePartnerRepository.save(partner);
        return mapToPartnerResponse(partner);
    }

    @Override
    @Transactional
    public ServicePartnerResponse verifyPartner(String providerEmail, Long partnerId) {
        User providerUser = userRepository.findByEmail(providerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Provider user not found"));

        ProviderProfile provider = providerProfileRepository.findByUserId(providerUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Provider profile not found"));

        ServicePartner partner = servicePartnerRepository.findByIdAndProviderId(partnerId, provider.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Service partner not found"));

        User workerUser = partner.getUser();
        if (workerUser != null) {
            workerUser.setEmailVerified(true);
            workerUser.setPhoneVerified(true);
            userRepository.save(workerUser);
        }
        partner.setActive(true);
        partner = servicePartnerRepository.save(partner);
        return mapToPartnerResponse(partner);
    }

    @Override
    @Transactional
    public BookingResponse assignPartnerToTask(String providerEmail, Long bookingId, Long partnerId) {
        User providerUser = userRepository.findByEmail(providerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Provider user not found"));

        ProviderProfile provider = providerProfileRepository.findByUserId(providerUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Provider profile not found"));

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        if (booking.getProvider() == null || !booking.getProvider().getId().equals(provider.getId())) {
            throw new BadRequestException("You are not authorized to assign partners for this booking");
        }

        ServicePartner partner = servicePartnerRepository.findByIdAndProviderId(partnerId, provider.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Service partner not found for your business"));

        if (!partner.getActive()) {
            throw new BadRequestException("Selected Service Partner is currently inactive");
        }

        booking.setServicePartner(partner);
        if (booking.getStatus() == BookingStatus.PENDING || booking.getStatus() == BookingStatus.ASSIGNED || booking.getStatus() == BookingStatus.ACCEPTED) {
            booking.setStatus(BookingStatus.PARTNER_ASSIGNED);
        }
        booking.setPartnerAssignedAt(LocalDateTime.now());
        booking = bookingRepository.save(booking);

        return mapToBookingResponse(booking);
    }

    @Override
    @Transactional
    public BookingResponse reassignPartnerToTask(String providerEmail, Long bookingId, Long partnerId) {
        return assignPartnerToTask(providerEmail, bookingId, partnerId);
    }

    @Override
    @Transactional
    public BookingResponse approveCompletionByProvider(String providerEmail, Long bookingId) {
        User providerUser = userRepository.findByEmail(providerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Provider user not found"));

        ProviderProfile provider = providerProfileRepository.findByUserId(providerUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Provider profile not found"));

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        if (!booking.getProvider().getId().equals(provider.getId())) {
            throw new BadRequestException("Not authorized for this booking");
        }

        booking.setStatus(BookingStatus.COMPLETED);
        booking.setProviderApprovedAt(LocalDateTime.now());
        if (booking.getPaymentStatus() != PaymentStatus.PAID) {
            booking.setPaymentStatus(PaymentStatus.PAID);
        }
        booking = bookingRepository.save(booking);

        return mapToBookingResponse(booking);
    }

    @Override
    @Transactional
    public ServicePartnerResponse getPartnerProfile(String partnerEmail) {
        User workerUser = userRepository.findByEmail(partnerEmail)
                .or(() -> userRepository.findByPhone(partnerEmail))
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        ServicePartner partner = servicePartnerRepository.findByUserId(workerUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Service Partner profile not found"));

        return mapToPartnerResponse(partner);
    }

    @Override
    @Transactional
    public List<BookingResponse> getPartnerAssignedTasks(String partnerEmail) {
        User workerUser = userRepository.findByEmail(partnerEmail)
                .or(() -> userRepository.findByPhone(partnerEmail))
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        ServicePartner partner = servicePartnerRepository.findByUserId(workerUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Service Partner profile not found"));

        List<Booking> bookings = bookingRepository.findAll()
                .stream()
                .filter(b -> b.getServicePartner() != null && b.getServicePartner().getId().equals(partner.getId()))
                .collect(Collectors.toList());

        return bookings.stream().map(this::mapToBookingResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public BookingResponse acceptTaskByPartner(String partnerEmail, Long bookingId) {
        Booking booking = verifyPartnerForBooking(partnerEmail, bookingId);
        booking.transitionToStatus(BookingStatus.PARTNER_ACCEPTED);
        booking.setPartnerAcceptedAt(LocalDateTime.now());
        booking = bookingRepository.save(booking);
        return mapToBookingResponse(booking);
    }

    @Override
    @Transactional
    public BookingResponse startJourneyByPartner(String partnerEmail, Long bookingId) {
        Booking booking = verifyPartnerForBooking(partnerEmail, bookingId);
        booking.transitionToStatus(BookingStatus.ON_THE_WAY);
        booking.setJourneyStartedAt(LocalDateTime.now());
        booking = bookingRepository.save(booking);

        // Notify user over STOMP
        try {
            messagingTemplate.convertAndSend("/topic/bookings/" + booking.getId() + "/location", Map.of(
                    "bookingId", booking.getId(),
                    "status", BookingStatus.ON_THE_WAY.name(),
                    "message", "Service Partner is on the way",
                    "timestamp", LocalDateTime.now().toString()
            ));
        } catch (Exception ignored) {}

        return mapToBookingResponse(booking);
    }

    @Override
    @Transactional
    public void updatePartnerLocation(String partnerEmail, UpdatePartnerLocationRequest request) {
        if (request == null || request.getTimestamp() == null) {
            throw new BadRequestException("Timestamp is required for location tracking telemetry");
        }

        long currentServerTime = System.currentTimeMillis();
        if (request.getTimestamp() > currentServerTime + 60_000L) {
            throw new BadRequestException("Telemetry timestamp cannot be in the future");
        }

        User workerUser = userRepository.findByEmail(partnerEmail)
                .or(() -> userRepository.findByPhone(partnerEmail))
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        ServicePartner partner = servicePartnerRepository.findByUserId(workerUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Service partner profile not found"));

        // Find active ON_THE_WAY booking for this partner FIRST before updating coordinates
        List<Booking> activeBookings = bookingRepository.findAll()
                .stream()
                .filter(b -> b.getServicePartner() != null && b.getServicePartner().getId().equals(partner.getId()))
                .filter(b -> b.getStatus() == BookingStatus.ON_THE_WAY)
                .collect(Collectors.toList());

        if (activeBookings.isEmpty()) {
            throw new BadRequestException("Location tracking is only active while on the way to a customer booking");
        }

        // Validate client telemetry timestamp against last accepted location sample timestamp
        LocalDateTime sampleTime = LocalDateTime.ofInstant(Instant.ofEpochMilli(request.getTimestamp()), ZoneId.systemDefault());

        if (partner.getLocationUpdatedAt() != null) {
            long lastAcceptedMillis = partner.getLocationUpdatedAt().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
            if (request.getTimestamp() <= lastAcceptedMillis) {
                // Out-of-order or duplicate telemetry packet: ignore stale sample
                return;
            }
        }

        partner.setCurrentLatitude(request.getLatitude());
        partner.setCurrentLongitude(request.getLongitude());
        partner.setLocationUpdatedAt(sampleTime);
        servicePartnerRepository.save(partner);

        for (Booking booking : activeBookings) {
            BigDecimal userLat = booking.getLatitude();
            BigDecimal userLng = booking.getLongitude();

            // 1. Calculate OSRM road route for customer-facing ETA & road distance
            RoutingResult roadRoute = routingService.calculateRoute(request.getLatitude(), request.getLongitude(), userLat, userLng, booking.getId());

            // 2. Calculate pure Haversine straight-line physical distance for 200m geofence arrival check
            double physicalDistanceKm = mapService.calculateStraightLineDistanceKm(request.getLatitude(), request.getLongitude(), userLat, userLng).doubleValue();

            // Geofence Check (< 200m or 0.2km physical straight-line distance)
            if (physicalDistanceKm <= 0.20) {
                // Auto mark ARRIVED & STOP LIVE TRACKING
                booking.transitionToStatus(BookingStatus.ARRIVED);
                booking.setArrivedAt(sampleTime);
                bookingRepository.saveAndFlush(booking);

                // Clear routing cache on ARRIVED status transition
                routingService.clearBookingCache(booking.getId());

                // Broadcast Arrival event via STOMP (Live tracking stops)
                try {
                    messagingTemplate.convertAndSend("/topic/bookings/" + booking.getId() + "/location", Map.of(
                            "bookingId", booking.getId(),
                            "status", BookingStatus.ARRIVED.name(),
                            "arrived", true,
                            "isLive", false,
                            "message", "Your Service Partner has arrived.",
                            "timestamp", sampleTime.toString()
                    ));
                } catch (Exception ignored) {}
            } else {
                // Broadcast live location while ON_THE_WAY using road route values
                try {
                    messagingTemplate.convertAndSend("/topic/bookings/" + booking.getId() + "/location", Map.of(
                            "bookingId", booking.getId(),
                            "status", BookingStatus.ON_THE_WAY.name(),
                            "partnerLatitude", request.getLatitude(),
                            "partnerLongitude", request.getLongitude(),
                            "distanceKm", roadRoute.getDistanceKm(),
                            "estimatedEtaMinutes", roadRoute.getEstimatedEtaMinutes(),
                            "routeSource", roadRoute.getRouteSource(),
                            "isLive", true,
                            "timestamp", sampleTime.toString()
                    ));
                } catch (Exception ignored) {}
            }
        }

    }

    @Override
    @Transactional
    public BookingResponse markArrivedByPartner(String partnerEmail, Long bookingId) {
        Booking booking = verifyPartnerForBooking(partnerEmail, bookingId);
        booking.transitionToStatus(BookingStatus.ARRIVED);
        booking.setArrivedAt(LocalDateTime.now());
        booking = bookingRepository.save(booking);

        try {
            messagingTemplate.convertAndSend("/topic/bookings/" + booking.getId() + "/location", Map.of(
                    "bookingId", booking.getId(),
                    "status", BookingStatus.ARRIVED.name(),
                    "arrived", true,
                    "isLive", false,
                    "message", "Your Service Partner has arrived.",
                    "timestamp", LocalDateTime.now().toString()
            ));
        } catch (Exception ignored) {}

        return mapToBookingResponse(booking);
    }

    @Override
    @Transactional
    public BookingResponse startWorkByPartner(String partnerEmail, Long bookingId) {
        Booking booking = verifyPartnerForBooking(partnerEmail, bookingId);
        booking.transitionToStatus(BookingStatus.WORK_STARTED);
        booking.setWorkStartedAt(LocalDateTime.now());
        booking = bookingRepository.save(booking);
        return mapToBookingResponse(booking);
    }

    @Override
    @Transactional
    public BookingResponse completeWorkByPartner(String partnerEmail, Long bookingId) {
        Booking booking = verifyPartnerForBooking(partnerEmail, bookingId);
        booking.transitionToStatus(BookingStatus.WORK_COMPLETED);
        booking.setWorkCompletedAt(LocalDateTime.now());
        booking = bookingRepository.save(booking);
        return mapToBookingResponse(booking);
    }

    @Override
    @Transactional
    public BookingResponse recordPaymentByPartner(String partnerEmail, Long bookingId, PaymentMethod method) {
        Booking booking = verifyPartnerForBooking(partnerEmail, bookingId);
        booking.setPaymentMethod(method != null ? method : PaymentMethod.AFTER_SERVICE);
        booking.setPaymentStatus(PaymentStatus.PAID);
        booking.transitionToStatus(BookingStatus.PAYMENT_COMPLETED);
        booking.setPaymentCompletedAt(LocalDateTime.now());
        booking = bookingRepository.save(booking);
        return mapToBookingResponse(booking);
    }

    private Booking verifyPartnerForBooking(String partnerEmail, Long bookingId) {
        User workerUser = userRepository.findByEmail(partnerEmail)
                .or(() -> userRepository.findByPhone(partnerEmail))
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        ServicePartner partner = servicePartnerRepository.findByUserId(workerUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Service partner profile not found"));

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        if (booking.getServicePartner() == null || !booking.getServicePartner().getId().equals(partner.getId())) {
            throw new BadRequestException("Task is not assigned to this Service Partner");
        }
        return booking;
    }

    private ServicePartnerResponse mapToPartnerResponse(ServicePartner partner) {
        ServicePartnerResponse resp = new ServicePartnerResponse();
        resp.setId(partner.getId());
        resp.setProviderId(partner.getProvider().getId());
        resp.setProviderName(partner.getProvider().getUser() != null ? partner.getProvider().getUser().getName() : "");
        resp.setUserId(partner.getUser().getId());
        resp.setName(partner.getName());
        resp.setPhone(partner.getPhone());
        resp.setEmail(partner.getEmail());
        resp.setTitle(partner.getTitle());
        resp.setExperience(partner.getExperience());
        resp.setRating(partner.getRating());
        resp.setActive(partner.getActive());
        resp.setCurrentLatitude(partner.getCurrentLatitude());
        resp.setCurrentLongitude(partner.getCurrentLongitude());
        resp.setLocationUpdatedAt(partner.getLocationUpdatedAt());
        resp.setCreatedAt(partner.getCreatedAt());
        return resp;
    }

    private BookingResponse mapToBookingResponse(Booking booking) {
        BookingResponse resp = new BookingResponse();
        resp.setId(booking.getId());
        resp.setBookingCode(booking.getBookingCode());
        resp.setServiceId(booking.getService().getId());
        resp.setServiceName(booking.getService().getName());
        resp.setCategoryId(booking.getService().getCategory().getId());
        resp.setCategoryName(booking.getService().getCategory().getName());
        resp.setUserId(booking.getUser().getId());
        resp.setUserName(booking.getUser().getName());
        if (booking.getProvider() != null) {
            resp.setProviderId(booking.getProvider().getId());
            resp.setProviderName(booking.getProvider().getUser() != null ? booking.getProvider().getUser().getName() : "");
            resp.setAssigned(true);
        } else {
            resp.setAssigned(false);
        }
        resp.setBookingDate(booking.getBookingDate());
        resp.setStartTime(booking.getStartTime());
        resp.setEndTime(booking.getEndTime());
        resp.setAddress(booking.getAddress());
        resp.setCity(booking.getCity());
        resp.setPincode(booking.getPincode());
        resp.setLatitude(booking.getLatitude());
        resp.setLongitude(booking.getLongitude());
        resp.setStatus(booking.getStatus());
        resp.setTotalAmount(booking.getTotalAmount());
        resp.setDiscountAmount(booking.getDiscountAmount());
        resp.setFinalAmount(booking.getFinalAmount());
        resp.setPaymentStatus(booking.getPaymentStatus());
        resp.setPaymentMethod(booking.getPaymentMethod());
        resp.setNotes(booking.getNotes());
        resp.setRating(booking.getRating());
        resp.setReview(booking.getReview());
        resp.setCreatedAt(booking.getCreatedAt());
        resp.setUpdatedAt(booking.getUpdatedAt());

        if (booking.getServicePartner() != null) {
            ServicePartner sp = booking.getServicePartner();
            resp.setServicePartnerId(sp.getId());
            resp.setServicePartnerName(sp.getName());
            resp.setServicePartnerPhone(sp.getPhone());
            resp.setServicePartnerTitle(sp.getTitle());
            resp.setServicePartnerRating(sp.getRating());
        }

        resp.setPartnerAssignedAt(booking.getPartnerAssignedAt());
        resp.setPartnerAcceptedAt(booking.getPartnerAcceptedAt());
        resp.setJourneyStartedAt(booking.getJourneyStartedAt());
        resp.setArrivedAt(booking.getArrivedAt());
        resp.setWorkStartedAt(booking.getWorkStartedAt());
        resp.setWorkCompletedAt(booking.getWorkCompletedAt());
        resp.setPaymentCompletedAt(booking.getPaymentCompletedAt());
        resp.setProviderApprovedAt(booking.getProviderApprovedAt());

        return resp;
    }
}
