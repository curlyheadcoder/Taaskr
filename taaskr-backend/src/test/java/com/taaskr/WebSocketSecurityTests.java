package com.taaskr;

import com.taaskr.entity.*;
import com.taaskr.enums.BookingStatus;
import com.taaskr.enums.PaymentMethod;
import com.taaskr.enums.PaymentStatus;
import com.taaskr.enums.Role;
import com.taaskr.repository.*;
import com.taaskr.security.JwtService;
import com.taaskr.security.WebSocketChannelInterceptor;
import com.taaskr.service.TrackingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.messaging.Message;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class WebSocketSecurityTests {

    @Autowired
    private TrackingService trackingService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProviderProfileRepository providerProfileRepository;

    @Autowired
    private ServicePartnerRepository servicePartnerRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private ServiceCategoryRepository categoryRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private WebSocketChannelInterceptor channelInterceptor;

    private User customer;
    private User otherCustomer;
    private User providerUser;
    private User otherProviderUser;
    private User partnerUser;
    private User adminUser;

    private ProviderProfile providerProfile;
    private ProviderProfile otherProviderProfile;
    private ServicePartner servicePartner;
    private Booking booking;

    @BeforeEach
    void setUp() {
        customer = createUser("ws_customer_" + UUID.randomUUID() + "@example.com", Role.USER);
        otherCustomer = createUser("ws_other_customer_" + UUID.randomUUID() + "@example.com", Role.USER);
        providerUser = createUser("ws_provider_" + UUID.randomUUID() + "@example.com", Role.PROVIDER);
        otherProviderUser = createUser("ws_other_provider_" + UUID.randomUUID() + "@example.com", Role.PROVIDER);
        partnerUser = createUser("ws_partner_" + UUID.randomUUID() + "@example.com", Role.PROVIDER);
        adminUser = createUser("ws_admin_" + UUID.randomUUID() + "@example.com", Role.ADMIN);

        providerProfile = createProviderProfile(providerUser);
        otherProviderProfile = createProviderProfile(otherProviderUser);
        servicePartner = createServicePartner(partnerUser, providerProfile);

        booking = createBooking(customer, providerProfile, servicePartner);
    }

    @Test
    void testAuthorizedCustomerCanAccessBookingTopic() {
        assertTrue(trackingService.isAuthorizedForBooking(customer.getEmail(), booking.getId()));
    }

    @Test
    void testUnauthorizedCustomerCannotAccessBookingTopic() {
        assertFalse(trackingService.isAuthorizedForBooking(otherCustomer.getEmail(), booking.getId()));
    }

    @Test
    void testAssignedProviderCanAccessBookingTopic() {
        assertTrue(trackingService.isAuthorizedForBooking(providerUser.getEmail(), booking.getId()));
    }

    @Test
    void testUnassignedProviderCannotAccessBookingTopic() {
        assertFalse(trackingService.isAuthorizedForBooking(otherProviderUser.getEmail(), booking.getId()));
    }

    @Test
    void testAssignedServicePartnerCanAccessBookingTopic() {
        assertTrue(trackingService.isAuthorizedForBooking(partnerUser.getEmail(), booking.getId()));
    }

    @Test
    void testAdminCanAccessBookingTopic() {
        assertTrue(trackingService.isAuthorizedForBooking(adminUser.getEmail(), booking.getId()));
    }

    @Test
    void testUnauthenticatedAccessRejected() {
        assertFalse(trackingService.isAuthorizedForBooking(null, booking.getId()));
        assertFalse(trackingService.isAuthorizedForBooking("", booking.getId()));
    }

    @Test
    void testChannelInterceptorStompConnectWithValidToken() {
        UserDetails userDetails = userDetailsService.loadUserByUsername(customer.getEmail());
        String token = jwtService.generateToken(userDetails);

        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        accessor.setNativeHeader("Authorization", "Bearer " + token);
        Message<byte[]> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        Message<?> result = channelInterceptor.preSend(message, null);
        assertNotNull(result);

        StompHeaderAccessor resultAccessor = StompHeaderAccessor.wrap(result);
        assertNotNull(resultAccessor.getUser());
        assertEquals(customer.getEmail(), resultAccessor.getUser().getName());
    }

    @Test
    void testChannelInterceptorStompConnectWithoutTokenFails() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        Message<byte[]> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        assertThrows(AccessDeniedException.class, () -> {
            channelInterceptor.preSend(message, null);
        });
    }

    @Test
    void testChannelInterceptorStompSubscribeUnauthorizedFails() {
        UserDetails otherDetails = userDetailsService.loadUserByUsername(otherCustomer.getEmail());
        String token = jwtService.generateToken(otherDetails);

        StompHeaderAccessor connectAccessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        connectAccessor.setNativeHeader("Authorization", "Bearer " + token);
        Message<?> connectMsg = channelInterceptor.preSend(MessageBuilder.createMessage(new byte[0], connectAccessor.getMessageHeaders()), null);

        StompHeaderAccessor subAccessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        subAccessor.setUser(StompHeaderAccessor.wrap(connectMsg).getUser());
        subAccessor.setDestination("/topic/bookings/" + booking.getId() + "/location");
        Message<byte[]> subMsg = MessageBuilder.createMessage(new byte[0], subAccessor.getMessageHeaders());

        assertThrows(AccessDeniedException.class, () -> {
            channelInterceptor.preSend(subMsg, null);
        });
    }

    private User createUser(String email, Role role) {
        User user = new User();
        user.setName("WS User " + role);
        user.setEmail(email);
        user.setPassword("Password123!");
        user.setPhone("9" + (long)(Math.random() * 1000000009L));
        user.setRole(role);
        user.setCity("Indore");
        user.setPincode("452001");
        user.setEmailVerified(true);
        user.setPhoneVerified(true);
        return userRepository.save(user);
    }

    private ProviderProfile createProviderProfile(User user) {
        ProviderProfile profile = new ProviderProfile();
        profile.setUser(user);
        profile.setBio("Bio");
        profile.setExperienceYears(5);
        profile.setRating(4.8);
        profile.setApproved(true);
        return providerProfileRepository.save(profile);
    }

    private ServicePartner createServicePartner(User user, ProviderProfile providerProfile) {
        ServicePartner partner = new ServicePartner();
        partner.setUser(user);
        partner.setProvider(providerProfile);
        partner.setName("Partner " + user.getId());
        partner.setPhone(user.getPhone());
        partner.setRating(4.9);
        partner.setActive(true);
        return servicePartnerRepository.save(partner);
    }

    private Booking createBooking(User customer, ProviderProfile provider, ServicePartner partner) {
        ServiceCategory category = new ServiceCategory();
        category.setName("Cat " + UUID.randomUUID());
        category.setActive(true);
        category = categoryRepository.save(category);

        Service service = new Service();
        service.setName("Service " + UUID.randomUUID());
        service.setCategory(category);
        service.setPrice(BigDecimal.valueOf(400));
        service.setDurationMinutes(45);
        service.setActive(true);
        service = serviceRepository.save(service);

        Booking b = new Booking();
        b.setBookingCode("WS-BK-" + UUID.randomUUID().toString().substring(0, 6));
        b.setUser(customer);
        b.setProvider(provider);
        b.setServicePartner(partner);
        b.setService(service);
        b.setBookingDate(LocalDate.now().plusDays(1));
        b.setStartTime(LocalTime.of(14, 0));
        b.setEndTime(LocalTime.of(15, 0));
        b.setAddress("456 Vijay Nagar");
        b.setCity("Indore");
        b.setPincode("452010");
        b.setStatus(BookingStatus.ON_THE_WAY);
        b.setTotalAmount(BigDecimal.valueOf(400));
        b.setFinalAmount(BigDecimal.valueOf(400));
        b.setPaymentStatus(PaymentStatus.PENDING);
        b.setPaymentMethod(PaymentMethod.AFTER_SERVICE);
        return bookingRepository.save(b);
    }
}
