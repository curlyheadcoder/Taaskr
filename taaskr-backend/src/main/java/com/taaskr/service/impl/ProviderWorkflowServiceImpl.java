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

    public ProviderWorkflowServiceImpl(UserRepository userRepository,
                                       ProviderProfileRepository providerProfileRepository,
                                       AvailabilitySlotRepository availabilitySlotRepository,
                                       BookingRepository bookingRepository,
                                       ProviderCategoryRepository providerCategoryRepository,
                                       ServiceCategoryRepository serviceCategoryRepository) {
        this.userRepository = userRepository;
        this.providerProfileRepository = providerProfileRepository;
        this.availabilitySlotRepository = availabilitySlotRepository;
        this.bookingRepository = bookingRepository;
        this.providerCategoryRepository = providerCategoryRepository;
        this.serviceCategoryRepository = serviceCategoryRepository;
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
                .map(this::mapBooking)
                .toList();
    }

    @Override
    @Transactional
    public ProviderBookingResponse acceptBooking(String providerEmail, Long bookingId) {
        ProviderProfile provider = getProviderByEmail(providerEmail);
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
        ProviderProfile provider = getProviderByEmail(providerEmail);
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

        if (booking.getPaymentMethod() != PaymentMethod.AFTER_SERVICE) {
            throw new BadRequestException("Only pay-after-service bookings can be marked as paid by a provider");
        }
        if (booking.getStatus() != BookingStatus.COMPLETED) {
            throw new BadRequestException("Payment can be marked as received only after the service is completed");
        }
        if (booking.getPaymentStatus() == PaymentStatus.PAID) {
            throw new BadRequestException("Booking is already marked as paid");
        }

        booking.setPaymentStatus(PaymentStatus.PAID);
        return mapBooking(bookingRepository.save(booking));
    }

    private boolean isValidTransition(BookingStatus current, BookingStatus target){
        if(current == BookingStatus.ACCEPTED && target == BookingStatus.IN_PROGRESS){
            return true;
        }
        return current == BookingStatus.IN_PROGRESS && target == BookingStatus.COMPLETED;
    }

    private ProviderProfile getApprovedProviderByEmail(String providerEmail) {
        ProviderProfile provider = getProviderByEmail(providerEmail);

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
        return new ProviderBookingResponse(
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

        user.setName(request.getName().trim());
        user.setPhone(request.getPhone());
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
                provider.getBio()
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
