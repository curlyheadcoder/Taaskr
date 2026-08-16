package com.taaskr.config;

import com.taaskr.entity.AvailabilitySlot;
import com.taaskr.entity.ProviderProfile;
import com.taaskr.entity.ProviderService;
import com.taaskr.entity.Service;
import com.taaskr.entity.ServiceCategory;
import com.taaskr.entity.User;
import com.taaskr.enums.Role;
import com.taaskr.repository.AvailabilitySlotRepository;
import com.taaskr.repository.ProviderProfileRepository;
import com.taaskr.repository.ProviderServiceRepository;
import com.taaskr.repository.ServiceCategoryRepository;
import com.taaskr.repository.ServiceRepository;
import com.taaskr.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner seedData(UserRepository userRepository,
                               PasswordEncoder passwordEncoder,
                               ServiceCategoryRepository categoryRepository,
                               ServiceRepository serviceRepository,
                               ProviderProfileRepository providerProfileRepository,
                               ProviderServiceRepository providerServiceRepository,
                               AvailabilitySlotRepository availabilitySlotRepository) {
        return args -> {
            seedUsers(userRepository, passwordEncoder);
            seedCatalog(categoryRepository, serviceRepository);
            seedProviderData(userRepository, serviceRepository, providerProfileRepository, providerServiceRepository, availabilitySlotRepository);
        };
    }

    private void seedUsers(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        seedUser(userRepository, passwordEncoder,
                "Admin User", "admin@taaskr.com", "Admin@123", "9999999991", Role.ADMIN, "Indore", "452001");

        seedUser(userRepository, passwordEncoder,
                "Regular User", "user@taaskr.com", "User@123", "9999999992", Role.USER, "Indore", "452001");

        seedUser(userRepository, passwordEncoder,
                "Provider User", "provider@taaskr.com", "Provider@123", "9999999993", Role.PROVIDER, "Indore", "452001");
    }

    private void seedUser(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          String name,
                          String email,
                          String rawPassword,
                          String phone,
                          Role role,
                          String city,
                          String pincode) {
        if (userRepository.existsByEmail(email)) {
            return;
        }

        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setPhone(phone);
        user.setRole(role);
        user.setCity(city);
        user.setPincode(pincode);
        user.setEnabled(true);

        userRepository.save(user);
    }

    private void seedCatalog(ServiceCategoryRepository categoryRepository,
                             ServiceRepository serviceRepository) {

        ServiceCategory plumbing = seedCategory(categoryRepository, "Plumbing", "Home plumbing repair and installation services");
        ServiceCategory cleaning = seedCategory(categoryRepository, "Cleaning", "Home and deep cleaning services");
        ServiceCategory electrical = seedCategory(categoryRepository, "Electrical", "Electrical repair and fitting services");

        seedService(serviceRepository, "Tap Repair", "Fix leaking or damaged taps", new BigDecimal("299.00"), 60, plumbing);
        seedService(serviceRepository, "Pipe Leakage Fix", "Detect and repair minor pipe leakage", new BigDecimal("499.00"), 90, plumbing);
        seedService(serviceRepository, "Bathroom Cleaning", "Deep clean bathroom and fittings", new BigDecimal("399.00"), 90, cleaning);
        seedService(serviceRepository, "Full Home Cleaning", "General home cleaning service", new BigDecimal("1499.00"), 240, cleaning);
        seedService(serviceRepository, "Switch Board Repair", "Repair or replace faulty switch boards", new BigDecimal("349.00"), 60, electrical);
    }

    private ServiceCategory seedCategory(ServiceCategoryRepository categoryRepository,
                                         String name,
                                         String description) {
        return categoryRepository.findByNameIgnoreCase(name).orElseGet(() -> {
            ServiceCategory category = new ServiceCategory();
            category.setName(name);
            category.setDescription(description);
            category.setActive(true);
            return categoryRepository.save(category);
        });
    }

    private void seedService(ServiceRepository serviceRepository,
                             String name,
                             String description,
                             BigDecimal price,
                             Integer durationMinutes,
                             ServiceCategory category) {
        boolean exists = serviceRepository.findByActiveTrueOrderByNameAsc()
                .stream()
                .anyMatch(service -> service.getName().equalsIgnoreCase(name));

        if (exists) {
            return;
        }

        Service serviceEntity = new Service();
        serviceEntity.setName(name);
        serviceEntity.setDescription(description);
        serviceEntity.setPrice(price);
        serviceEntity.setDurationMinutes(durationMinutes);
        serviceEntity.setCategory(category);
        serviceEntity.setActive(true);

        serviceRepository.save(serviceEntity);
    }

    private void seedProviderData(UserRepository userRepository,
                                  ServiceRepository serviceRepository,
                                  ProviderProfileRepository providerProfileRepository,
                                  ProviderServiceRepository providerServiceRepository,
                                  AvailabilitySlotRepository availabilitySlotRepository) {

        User providerUser = userRepository.findByEmail("provider@taaskr.com").orElse(null);
        if (providerUser == null) {
            return;
        }

        ProviderProfile providerProfile = providerProfileRepository.findByUserId(providerUser.getId())
                .orElseGet(() -> {
                    ProviderProfile profile = new ProviderProfile();
                    profile.setUser(providerUser);
                    profile.setExperienceYears(3);
                    profile.setCity(providerUser.getCity());
                    profile.setPincode(providerUser.getPincode());
                    profile.setApproved(true);
                    profile.setRating(4.7);
                    profile.setTotalJobs(12);
                    profile.setBio("Experienced home service professional");
                    return providerProfileRepository.save(profile);
                });

        List<Service> services = serviceRepository.findByActiveTrueOrderByNameAsc();
        for (Service service : services) {
            boolean mappingExists = providerServiceRepository.findByProviderId(providerProfile.getId())
                    .stream()
                    .anyMatch(ps -> ps.getService().getId().equals(service.getId()));

            if (!mappingExists) {
                ProviderService providerService = new ProviderService();
                providerService.setProvider(providerProfile);
                providerService.setService(service);
                providerServiceRepository.save(providerService);
            }
        }

        LocalDate tomorrow = LocalDate.now().plusDays(1);

        seedAvailabilitySlot(availabilitySlotRepository, providerProfile, tomorrow, LocalTime.of(9, 0), LocalTime.of(11, 0));
        seedAvailabilitySlot(availabilitySlotRepository, providerProfile, tomorrow, LocalTime.of(11, 30), LocalTime.of(13, 30));
        seedAvailabilitySlot(availabilitySlotRepository, providerProfile, tomorrow, LocalTime.of(15, 0), LocalTime.of(18, 0));
    }

    private void seedAvailabilitySlot(AvailabilitySlotRepository availabilitySlotRepository,
                                      ProviderProfile providerProfile,
                                      LocalDate date,
                                      LocalTime startTime,
                                      LocalTime endTime) {
        boolean exists = availabilitySlotRepository.findByProviderIdAndAvailableDateOrderByStartTimeAsc(providerProfile.getId(), date)
                .stream()
                .anyMatch(slot -> slot.getStartTime().equals(startTime) && slot.getEndTime().equals(endTime));

        if (exists) {
            return;
        }

        AvailabilitySlot slot = new AvailabilitySlot();
        slot.setProvider(providerProfile);
        slot.setAvailableDate(date);
        slot.setStartTime(startTime);
        slot.setEndTime(endTime);
        slot.setBooked(false);

        availabilitySlotRepository.save(slot);
    }
}