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
import jakarta.transaction.Transactional;
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

    public ProviderWorkflowServiceImpl(UserRepository userRepository,
                                       ProviderProfileRepository providerProfileRepository,
                                       AvailabilitySlotRepository availabilitySlotRepository,
                                       BookingRepository bookingRepository,
                                       ProviderCategoryRepository providerCategoryRepository,
                                       ServiceCategoryRepository serviceCategoryRepository,
                                       com.taaskr.repository.ProviderServiceRepository providerServiceRepository) {
        this.userRepository = userRepository;
        this.providerProfileRepository = providerProfileRepository;
        this.availabilitySlotRepository = availabilitySlotRepository;
        this.bookingRepository = bookingRepository;
        this.providerCategoryRepository = providerCategoryRepository;
        this.serviceCategoryRepository = serviceCategoryRepository;
        this.providerServiceRepository = providerServiceRepository;
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
            case IN_PROGRESS -> 1;
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
        ProviderProfile provider = getProviderByEmail(providerEmail);
        Booking booking = getProviderBooking(provider.getId(), bookingId);

        if(booking.getStatus() != BookingStatus.ASSIGNED){
            throw new BadRequestException("Only Assigned bookings can be rejected");
        }
        booking.setStatus(BookingStatus.REJECTED);
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
        booking.setStatus(target);

        if(target == BookingStatus.COMPLETED){
            provider.setTotalJobs(provider.getTotalJobs() + 1);
            providerProfileRepository.save(provider);
        }

        Booking saved = bookingRepository.save(booking);
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
        return mapBooking(saved);
    }

    @Override
    @Transactional
    public List<ProviderBookingResponse> getAvailableTasks(String providerEmail) {
        ProviderProfile provider = getProviderByEmail(providerEmail);
        
        List<Long> providerCategoryIds = providerCategoryRepository.findByProviderId(provider.getId())
                .stream().map(pc -> pc.getCategory().getId()).toList();
                
        if (providerCategoryIds.isEmpty()) {
            return List.of();
        }

        List<Booking> pendingBookings = bookingRepository.findByStatusAndCityAndServiceCategoryIdInOrderByCreatedAtDesc(
                BookingStatus.PENDING, provider.getCity(), providerCategoryIds);

        return pendingBookings.stream().filter(booking -> {
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
        
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
                
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new BadRequestException("This booking is no longer available");
        }
        
        if (booking.getProvider() != null) {
            throw new BadRequestException("This booking has already been assigned");
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
        if(current == BookingStatus.ACCEPTED && target == BookingStatus.IN_PROGRESS){
            return true;
        }
        return current == BookingStatus.IN_PROGRESS && target == BookingStatus.COMPLETED;
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

        return response;
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
                Boolean.TRUE.equals(provider.getUser().getPhoneVerified())
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
}
