package com.taaskr.service.impl;

import com.taaskr.dto.provider.AvailabilityResponse;
import com.taaskr.dto.provider.CreateAvailabilityRequest;
import com.taaskr.dto.provider.ProviderBookingResponse;
import com.taaskr.dto.provider.UpdateProviderBookingStatusRequest;
import com.taaskr.entity.AvailabilitySlot;
import com.taaskr.entity.Booking;
import com.taaskr.entity.ProviderProfile;
import com.taaskr.entity.User;
import com.taaskr.enums.BookingStatus;
import com.taaskr.enums.PaymentMethod;
import com.taaskr.enums.PaymentStatus;
import com.taaskr.enums.Role;
import com.taaskr.exception.BadRequestException;
import com.taaskr.exception.ResourceNotFoundException;
import com.taaskr.repository.AvailabilitySlotRepository;
import com.taaskr.repository.BookingRepository;
import com.taaskr.repository.ProviderProfileRepository;
import com.taaskr.repository.UserRepository;
import com.taaskr.repository.ProviderCategoryRepository;
import com.taaskr.repository.ServiceCategoryRepository;
import com.taaskr.service.ProviderWorkflowService;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;

import com.taaskr.dto.provider.ProviderProfileResponse;
import com.taaskr.dto.provider.UpdateProviderProfileRequest;
import com.taaskr.dto.provider.UpdateProviderCategoriesRequest;
import com.taaskr.dto.service.CategoryResponse;
import com.taaskr.entity.ProviderCategory;
import com.taaskr.entity.ServiceCategory;
import java.util.stream.Collectors;

import java.util.List;

@Service
public class ProviderWorkflowServiceImpl implements ProviderWorkflowService {

    private final UserRepository userRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final AvailabilitySlotRepository availabilitySlotRepository;
    private final BookingRepository bookingRepository;
    private final ProviderCategoryRepository providerCategoryRepository;
    private final ServiceCategoryRepository serviceCategoryRepository;
    private final com.taaskr.repository.ProviderServiceRepository providerServiceRepository;
    private final com.taaskr.service.PayoutService payoutService;

    public ProviderWorkflowServiceImpl(UserRepository userRepository,
                                       ProviderProfileRepository providerProfileRepository,
                                       AvailabilitySlotRepository availabilitySlotRepository,
                                       BookingRepository bookingRepository,
                                       ProviderCategoryRepository providerCategoryRepository,
                                       ServiceCategoryRepository serviceCategoryRepository,
                                       com.taaskr.repository.ProviderServiceRepository providerServiceRepository,
                                       com.taaskr.service.PayoutService payoutService) {
        this.userRepository = userRepository;
        this.providerProfileRepository = providerProfileRepository;
        this.availabilitySlotRepository = availabilitySlotRepository;
        this.bookingRepository = bookingRepository;
        this.providerCategoryRepository = providerCategoryRepository;
        this.serviceCategoryRepository = serviceCategoryRepository;
        this.providerServiceRepository = providerServiceRepository;
        this.payoutService = payoutService;
    }

    @Override
    @Transactional
    public AvailabilityResponse createAvailability(String providerEmail, CreateAvailabilityRequest request) {
        ProviderProfile provider = getApprovedProviderByEmail(providerEmail);
        if(!request.getEndTime().isAfter(request.getStartTime())){
            throw new BadRequestException("End time must be before start time");
        }
        boolean overlapExists = availabilitySlotRepository
                .existsByProviderIdAndAvailableDateAndStartTimeLessThanAndEndTimeGreaterThan(
                        provider.getId(),
                        request.getAvailableDate(),
                        request.getEndTime(),
                        request.getStartTime()
                );
        if(overlapExists){
            throw new BadRequestException("Availability slot overlaps with existing slot");
        }

        AvailabilitySlot slot = new AvailabilitySlot();
        slot.setProvider(provider);
        slot.setAvailableDate(request.getAvailableDate());
        slot.setStartTime(request.getStartTime());
        slot.setEndTime(request.getEndTime());
        slot.setBooked(false);

        AvailabilitySlot saved = availabilitySlotRepository.save(slot);
        return mapAvailability(saved);
    }

    @Override
    @Transactional
    public List<AvailabilityResponse> getMyAvailability(String providerEmail) {
        ProviderProfile provider = getProviderByEmail(providerEmail);
        return availabilitySlotRepository.findByProviderIdOrderByAvailableDateAscStartTimeAsc(provider.getId())
                .stream()
                .map(this::mapAvailability)
                .toList();
    }



    @Override
    @Transactional
    public void deleteAvailability(String providerEmail, Long availabilityId) {
        ProviderProfile provider = getProviderByEmail(providerEmail);
        AvailabilitySlot slot = availabilitySlotRepository.findByIdAndProviderId(availabilityId, provider.getId())
                .orElseThrow(()-> new ResourceNotFoundException("Availability slot not found"));
        if(Boolean.TRUE.equals(slot.getBooked())){
            throw new BadRequestException("Booked availability slot cannot be deleted");
        }
        availabilitySlotRepository.delete(slot);
    }

    @Override
    @Transactional
    public List<ProviderBookingResponse> getMyAssignedBookings(String providerEmail) {
        ProviderProfile provider = getProviderByEmail(providerEmail);
        return bookingRepository.findByProviderIdOrderByCreatedAtDesc(provider.getId())
                .stream()
                .sorted((b1, b2) -> {
                    int p1 = getStatusPriority(b1.getStatus());
                    int p2 = getStatusPriority(b2.getStatus());
                    if (p1 != p2) return Integer.compare(p1, p2);
                    return b2.getCreatedAt().compareTo(b1.getCreatedAt());
                })
                .map(this::mapBooking)
                .toList();
    }

    private int getStatusPriority(BookingStatus status) {
        if (status == null) return 2;
        return switch (status) {
            case IN_PROGRESS, IN_TRANSIT -> 1;
            case PENDING, ASSIGNED, ACCEPTED -> 2;
            case COMPLETED -> 3;
            case CANCELLED, REJECTED -> 4;
        };
    }

    @Override
    @Transactional
    public ProviderBookingResponse acceptBooking(String providerEmail, Long bookingId) {
        ProviderProfile provider = getApprovedProviderByEmail(providerEmail);
        Booking booking = getProviderBooking(provider.getId(), bookingId);

        if(booking.getStatus() != BookingStatus.ASSIGNED){
            throw new BadRequestException("Only Assigned bookings can be accepted");
        }
        booking.setStatus(BookingStatus.ACCEPTED);
        Booking saved = bookingRepository.save(booking);
        return mapBooking(saved);
    }

    @Override
    @Transactional
    public ProviderBookingResponse rejectBooking(String providerEmail, Long bookingId) {
        return rejectBooking(providerEmail, bookingId, null);
    }

    @Override
    @Transactional
    public ProviderBookingResponse rejectBooking(String providerEmail, Long bookingId, String reason) {
        ProviderProfile provider = getProviderByEmail(providerEmail);
        Booking booking = getProviderBooking(provider.getId(), bookingId);

        if(booking.getStatus() != BookingStatus.ASSIGNED && booking.getStatus() != BookingStatus.PENDING){
            throw new BadRequestException("Only Pending or Assigned bookings can be rejected");
        }
        booking.setStatus(BookingStatus.REJECTED);
        booking.setCancellationReason(reason != null && !reason.isBlank() ? reason.trim() : "Rejected by service provider");
        booking.setCancelledByRole("PROVIDER");
        Booking saved = bookingRepository.save(booking);
        return mapBooking(saved);
    }

    @Override
    @Transactional
    public ProviderBookingResponse updateBookingStatus(String providerEmail, Long bookingId, UpdateProviderBookingStatusRequest request) {
        ProviderProfile provider = getApprovedProviderByEmail(providerEmail);
        Booking booking = getProviderBooking(provider.getId(), bookingId);

        BookingStatus current = booking.getStatus();
        BookingStatus target = request.getStatus();

        if(!isValidTransition(current, target)){
            throw new BadRequestException("Invalid booking status from " + current + " to " + target);
        }

        if (target == BookingStatus.IN_PROGRESS || target == BookingStatus.IN_TRANSIT) {
            if (booking.getBookingDate() != null && booking.getStartTime() != null) {
                java.time.LocalDateTime scheduledStart = java.time.LocalDateTime.of(booking.getBookingDate(), booking.getStartTime());
                java.time.LocalDateTime nowIST = java.time.LocalDateTime.now(java.time.ZoneId.of("Asia/Kolkata"));
                if (nowIST.isBefore(scheduledStart)) {
                    throw new BadRequestException("Cannot start work before the assigned booking time: " 
                            + booking.getBookingDate() + " at " + booking.getStartTime());
                }
            }
        }

        booking.setStatus(target);

        if (target == BookingStatus.REJECTED || target == BookingStatus.CANCELLED) {
            if (request.getReason() != null && !request.getReason().isBlank()) {
                booking.setCancellationReason(request.getReason().trim());
            } else if (booking.getCancellationReason() == null) {
                booking.setCancellationReason("Cancelled/Rejected by provider");
            }
            booking.setCancelledByRole("PROVIDER");
        }

        if(target == BookingStatus.COMPLETED){
            provider.setTotalJobs(provider.getTotalJobs() + 1);
            providerProfileRepository.save(provider);
        }

        Booking saved = bookingRepository.save(booking);

        if (saved.getStatus() == BookingStatus.COMPLETED &&
                (saved.getPaymentStatus() == PaymentStatus.PAID || saved.getPaymentMethod() == PaymentMethod.AFTER_SERVICE)) {
            payoutService.creditBookingEarnings(saved);
        }

        return mapBooking(saved);
    }

    @Override
    @Transactional
    public ProviderBookingResponse markAfterServicePaymentReceived(String providerEmail, Long bookingId) {
        ProviderProfile provider = getProviderByEmail(providerEmail);
        Booking booking = getProviderBooking(provider.getId(), bookingId);

        if (booking.getStatus() != BookingStatus.COMPLETED) {
            throw new BadRequestException("Can only collect payment after job is completed");
        }
        if (booking.getPaymentMethod() != PaymentMethod.AFTER_SERVICE) {
            throw new BadRequestException("This booking is not marked for Cash After Service");
        }
        
        booking.setPaymentStatus(PaymentStatus.PAID);
        Booking saved = bookingRepository.save(booking);
        payoutService.creditBookingEarnings(saved);
        return mapBooking(saved);
    }

    @Override
    @Transactional
    public List<ProviderBookingResponse> getAvailableTasks(String providerEmail) {
        ProviderProfile provider = getProviderByEmail(providerEmail);
        
        // If provider is offline, no available tasks are shown
        if (!Boolean.TRUE.equals(provider.getIsOnline())) {
            return List.of();
        }

        List<Long> providerCategoryIds = providerCategoryRepository.findByProviderId(provider.getId())
                .stream().map(pc -> pc.getCategory().getId()).toList();
                
        if (providerCategoryIds.isEmpty()) {
            return List.of();
        }

        List<Booking> pendingBookings = bookingRepository.findByStatusAndCityAndServiceCategoryIdInOrderByCreatedAtDesc(
                BookingStatus.PENDING, provider.getCity(), providerCategoryIds);

        // Return only tasks that are PENDING, unassigned (provider == null), and have not been accepted by anyone
        return pendingBookings.stream()
                .filter(booking -> booking.getProvider() == null)
                .filter(booking -> {
                    java.time.LocalTime endTime = booking.getStartTime().plusMinutes(booking.getService().getDurationMinutes());
                    boolean hasOverlap = bookingRepository.existsByProviderIdAndBookingDateAndStartTimeLessThanAndEndTimeGreaterThan(
                            provider.getId(), booking.getBookingDate(), endTime, booking.getStartTime());
                    return !hasOverlap;
                }).map(this::mapBooking).toList();
    }

    @Override
    @Transactional
    public ProviderBookingResponse claimTask(String providerEmail, Long bookingId) {
        ProviderProfile provider = getApprovedProviderByEmail(providerEmail);
        
        if (!Boolean.TRUE.equals(provider.getIsOnline())) {
            throw new BadRequestException("You must be ONLINE to claim tasks");
        }

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
                
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new BadRequestException("This booking is no longer available");
        }
        
        if (booking.getProvider() != null) {
            throw new BadRequestException("This booking has already been accepted by another provider");
        }

        java.time.LocalTime endTime = booking.getStartTime().plusMinutes(booking.getService().getDurationMinutes());
        boolean hasOverlap = bookingRepository.existsByProviderIdAndBookingDateAndStartTimeLessThanAndEndTimeGreaterThan(
                provider.getId(), booking.getBookingDate(), endTime, booking.getStartTime());
        
        if (hasOverlap) {
            throw new BadRequestException("You have an overlapping booking at this time");
        }
        
        booking.setProvider(provider);
        booking.setStatus(BookingStatus.ASSIGNED);
        
        List<AvailabilitySlot> existingSlots = availabilitySlotRepository.findByProviderIdAndAvailableDateOrderByStartTimeAsc(provider.getId(), booking.getBookingDate());
        boolean slotExists = existingSlots.stream().anyMatch(slot -> 
            !slot.getStartTime().isAfter(booking.getStartTime()) && !slot.getEndTime().isBefore(endTime)
        );
        
        if (!slotExists) {
            AvailabilitySlot newSlot = new AvailabilitySlot();
            newSlot.setProvider(provider);
            newSlot.setAvailableDate(booking.getBookingDate());
            newSlot.setStartTime(booking.getStartTime());
            newSlot.setEndTime(endTime);
            newSlot.setBooked(true);
            availabilitySlotRepository.save(newSlot);
        } else {
            existingSlots.stream().filter(slot -> 
                !slot.getStartTime().isAfter(booking.getStartTime()) && !slot.getEndTime().isBefore(endTime)
            ).findFirst().ifPresent(slot -> {
                slot.setBooked(true);
                availabilitySlotRepository.save(slot);
            });
        }
        
        Booking saved = bookingRepository.save(booking);
        return mapBooking(saved);
    }

    private boolean isValidTransition(BookingStatus current, BookingStatus target){
        if(current == BookingStatus.ACCEPTED && (target == BookingStatus.IN_PROGRESS || target == BookingStatus.IN_TRANSIT)){
            return true;
        }
        if((current == BookingStatus.IN_PROGRESS || current == BookingStatus.IN_TRANSIT) && target == BookingStatus.COMPLETED){
            return true;
        }
        return false;
    }

    private ProviderProfile getApprovedProviderByEmail(String providerEmail) {
        ProviderProfile provider = getProviderByEmail(providerEmail);

        if (!Boolean.TRUE.equals(provider.getUser().getEmailVerified()) || !Boolean.TRUE.equals(provider.getUser().getPhoneVerified())) {
            throw new BadRequestException("Your partner email address and mobile phone number must both be verified before claiming or working on tasks. Please verify them in your partner console.");
        }

        if(!Boolean.TRUE.equals(provider.getApproved())){
            throw new BadRequestException("Provider is not approved yet");
        }
        return provider;
    }

    private ProviderProfile getProviderByEmail(String providerEmail) {
        User user = userRepository.findByEmail(providerEmail)
                .orElseThrow(()-> new ResourceNotFoundException("Provider User not found"));

        if(user.getRole() != Role.PROVIDER){
            throw new BadRequestException("User is not a provider");
        }

        return providerProfileRepository.findByUserId(user.getId())
                .orElseThrow(()-> new ResourceNotFoundException("Provider profile not found"));
    }

    private Booking getProviderBooking(Long providerId, Long bookingId) {
        return bookingRepository.findByIdAndProviderId(bookingId, providerId)
                .orElseThrow(()-> new ResourceNotFoundException("Booking not found for provider"));
    }

    private AvailabilityResponse mapAvailability(AvailabilitySlot slot) {
        return new AvailabilityResponse(
                slot.getId(),
                slot.getAvailableDate(),
                slot.getStartTime(),
                slot.getEndTime(),
                slot.getBooked()
        );
    }

    private ProviderBookingResponse mapBooking(Booking booking) {
        ProviderBookingResponse response = new ProviderBookingResponse(
                booking.getId(),
                booking.getBookingCode(),
                booking.getService().getId(),
                booking.getService().getName(),
                booking.getService().getCategory().getName(),
                booking.getUser().getId(),
                booking.getUser().getName(),
                booking.getUser().getPhone(),
                booking.getBookingDate(),
                booking.getStartTime(),
                booking.getEndTime(),
                booking.getAddress(),
                booking.getCity(),
                booking.getPincode(),
                booking.getLatitude(),
                booking.getLongitude(),
                booking.getStatus(),
                booking.getFinalAmount(),
                booking.getPaymentStatus(),
                booking.getPaymentMethod(),
                booking.getNotes(),
                booking.getCreatedAt()
        );

        response.setDropAddress(booking.getDropAddress());
        response.setDropCity(booking.getDropCity());
        response.setDropPincode(booking.getDropPincode());
        response.setDropLatitude(booking.getDropLatitude());
        response.setDropLongitude(booking.getDropLongitude());
        response.setPackageDescription(booking.getPackageDescription());
        response.setPackageWeightKg(booking.getPackageWeightKg());
        response.setDistanceKm(booking.getDistanceKm());

        if (booking.getVehicle() != null) {
            response.setVehicleType(booking.getVehicle().getVehicleType());
            response.setVehicleRegistrationNumber(booking.getVehicle().getRegistrationNumber());
        }

        response.setCancellationReason(booking.getCancellationReason());
        response.setCancelledByRole(booking.getCancelledByRole());

        return response;
    }

    @Override
    @Transactional
    public ProviderProfileResponse updateOnlineStatus(String providerEmail, boolean isOnline) {
        ProviderProfile provider = getProviderByEmail(providerEmail);
        provider.setIsOnline(isOnline);
        providerProfileRepository.save(provider);
        return mapProfileResponse(provider);
    }

    @Override
    @Transactional
    public ProviderProfileResponse getProviderProfile(String providerEmail) {
        ProviderProfile provider = getProviderByEmail(providerEmail);
        return mapProfileResponse(provider);
    }

    @Override
    @Transactional
    public ProviderProfileResponse updateProviderProfile(String providerEmail, UpdateProviderProfileRequest request) {
        ProviderProfile provider = getProviderByEmail(providerEmail);
        User user = provider.getUser();

        String newPhone = request.getPhone() != null ? request.getPhone().trim() : null;
        if (newPhone != null && !newPhone.equals(user.getPhone())) {
            user.setPhone(newPhone);
            user.setPhoneVerified(false);
        }

        user.setName(request.getName().trim());
        user.setCity(request.getCity());
        user.setPincode(request.getPincode());
        userRepository.save(user);

        provider.setExperienceYears(request.getExperienceYears());
        provider.setBio(request.getBio());
        provider.setCity(request.getCity());
        provider.setPincode(request.getPincode());
        providerProfileRepository.save(provider);

        return mapProfileResponse(provider);
    }

    private ProviderProfileResponse mapProfileResponse(ProviderProfile provider) {
        return new ProviderProfileResponse(
                provider.getId(),
                provider.getUser().getId(),
                provider.getUser().getName(),
                provider.getUser().getEmail(),
                provider.getUser().getPhone(),
                provider.getExperienceYears(),
                provider.getCity(),
                provider.getPincode(),
                provider.getApproved(),
                provider.getRating(),
                provider.getTotalJobs(),
                provider.getBio(),
                Boolean.TRUE.equals(provider.getUser().getEmailVerified()),
                Boolean.TRUE.equals(provider.getUser().getPhoneVerified()),
                provider.getAdminRemarks(),
                provider.getIsOnline()
        );
    }

    @Override
    @Transactional
    public List<CategoryResponse> getMyCategories(String providerEmail) {
        ProviderProfile provider = getProviderByEmail(providerEmail);
        return providerCategoryRepository.findByProviderId(provider.getId())
                .stream()
                .map(pc -> new CategoryResponse(
                        pc.getCategory().getId(),
                        pc.getCategory().getName(),
                        pc.getCategory().getDescription(),
                        pc.getCategory().getActive()
                ))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public List<CategoryResponse> updateMyCategories(String providerEmail, UpdateProviderCategoriesRequest request) {
        ProviderProfile provider = getProviderByEmail(providerEmail);
        
        providerCategoryRepository.deleteByProviderId(provider.getId());
        
        for (Long categoryId : request.getCategoryIds()) {
            ServiceCategory category = serviceCategoryRepository.findById(categoryId)
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
            if (!Boolean.TRUE.equals(category.getActive())) {
                throw new BadRequestException("Cannot select an inactive category");
            }
            ProviderCategory pc = new ProviderCategory(provider, category);
            providerCategoryRepository.save(pc);
        }
        
        return getMyCategories(providerEmail);
    }

    @Override
    @Transactional(readOnly = true)
    public com.taaskr.dto.provider.ProviderBankDetailsResponse getBankDetails(String providerEmail) {
        ProviderProfile provider = getProviderByEmail(providerEmail);
        return new com.taaskr.dto.provider.ProviderBankDetailsResponse(
                provider.getBankAccountNumber(),
                provider.getBankIfsc(),
                provider.getBankName(),
                provider.getAccountHolderName(),
                provider.getUpiId()
        );
    }

    @Override
    @Transactional
    public com.taaskr.dto.provider.ProviderBankDetailsResponse updateBankDetails(String providerEmail, com.taaskr.dto.provider.UpdateBankDetailsRequest request) {
        ProviderProfile provider = getProviderByEmail(providerEmail);

        if (request.getBankAccountNumber() != null && !request.getBankAccountNumber().isBlank()) {
            String acc = request.getBankAccountNumber().trim();
            if (!acc.matches("^[0-9]{9,18}$")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bank account number must be between 9 and 18 numeric digits");
            }
            provider.setBankAccountNumber(acc);
        }
        if (request.getBankIfsc() != null && !request.getBankIfsc().isBlank()) {
            String ifsc = request.getBankIfsc().trim().toUpperCase();
            if (!ifsc.matches("^[A-Z]{4}0[A-Z0-9]{6}$")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid IFSC Code format. Must be 11 characters (e.g. HDFC0001234)");
            }
            provider.setBankIfsc(ifsc);
        }
        if (request.getBankName() != null && !request.getBankName().isBlank()) {
            String name = request.getBankName().trim();
            if (!name.matches("^[a-zA-Z\\s\\.\\&\\-]{2,100}$")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bank name contains invalid characters");
            }
            provider.setBankName(name);
        }
        if (request.getAccountHolderName() != null && !request.getAccountHolderName().isBlank()) {
            String holder = request.getAccountHolderName().trim();
            if (!holder.matches("^[a-zA-Z\\s\\.\\-]{2,100}$")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Account holder name contains invalid characters");
            }
            provider.setAccountHolderName(holder);
        }
        if (request.getUpiId() != null && !request.getUpiId().isBlank()) {
            String upi = request.getUpiId().trim();
            if (!upi.matches("^[a-zA-Z0-9.\\-_]{2,256}@[a-zA-Z][a-zA-Z0-9]{2,64}$")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid UPI ID format. Example: name@okhdfcbank or 9876543210@paytm");
            }
            provider.setUpiId(upi);
        }

        ProviderProfile saved = providerProfileRepository.save(provider);
        return new com.taaskr.dto.provider.ProviderBankDetailsResponse(
                saved.getBankAccountNumber(),
                saved.getBankIfsc(),
                saved.getBankName(),
                saved.getAccountHolderName(),
                saved.getUpiId()
        );
    }
}
