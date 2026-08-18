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
        seedUser(userRepository, passwordEncoder, "Admin User", "admin@taaskr.com", "Admin@123", "9999999991", Role.ADMIN, "Indore", "452001");
        seedUser(userRepository, passwordEncoder, "Regular User", "user@taaskr.com", "User@123", "9999999992", Role.USER, "Indore", "452001");
        
        // Seed multiple providers
        seedUser(userRepository, passwordEncoder, "Provider User", "provider@taaskr.com", "Provider@123", "9999999993", Role.PROVIDER, "Indore", "452001");
        seedUser(userRepository, passwordEncoder, "RO Expert 1", "ro@taaskr.com", "Provider@123", "9999999994", Role.PROVIDER, "Indore", "452001");
        seedUser(userRepository, passwordEncoder, "AC Expert 1", "ac@taaskr.com", "Provider@123", "9999999995", Role.PROVIDER, "Indore", "452010");
        seedUser(userRepository, passwordEncoder, "Electrician 1", "electrician@taaskr.com", "Provider@123", "9999999996", Role.PROVIDER, "Indore", "452001");
        seedUser(userRepository, passwordEncoder, "Plumber 1", "plumber@taaskr.com", "Provider@123", "9999999997", Role.PROVIDER, "Indore", "452002");
        seedUser(userRepository, passwordEncoder, "Home Appliance Expert", "appliance@taaskr.com", "Provider@123", "9999999998", Role.PROVIDER, "Indore", "452001");
    }

    private User seedUser(UserRepository userRepository, PasswordEncoder passwordEncoder, String name, String email, String rawPassword, String phone, Role role, String city, String pincode) {
        return userRepository.findByEmail(email).orElseGet(() -> {
            User user = new User();
            user.setName(name);
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode(rawPassword));
            user.setPhone(phone);
            user.setRole(role);
            user.setCity(city);
            user.setPincode(pincode);
            user.setEnabled(true);
            return userRepository.save(user);
        });
    }

    private void seedCatalog(ServiceCategoryRepository categoryRepository, ServiceRepository serviceRepository) {
        ServiceCategory plumbing = seedCategory(categoryRepository, "Plumbing", "Home plumbing repair and installation services");
        ServiceCategory cleaning = seedCategory(categoryRepository, "Cleaning", "Home and deep cleaning services");
        ServiceCategory electrical = seedCategory(categoryRepository, "Electrical", "Electrical repair and fitting services");
        ServiceCategory appliances = seedCategory(categoryRepository, "Appliances", "Home appliance repair and maintenance");

        // Plumbing
        seedService(serviceRepository, "Tap Repair", "Fix leaking or damaged taps", new BigDecimal("299.00"), 60, plumbing);
        seedService(serviceRepository, "Pipe Leakage Fix", "Detect and repair minor pipe leakage", new BigDecimal("499.00"), 90, plumbing);
        
        // Cleaning
        seedService(serviceRepository, "Bathroom Cleaning", "Deep clean bathroom and fittings", new BigDecimal("399.00"), 90, cleaning);
        seedService(serviceRepository, "Full Home Cleaning", "General home cleaning service", new BigDecimal("1499.00"), 240, cleaning);
        
        // Electrical
        seedService(serviceRepository, "Switch Board Repair", "Repair or replace faulty switch boards", new BigDecimal("349.00"), 60, electrical);
        seedService(serviceRepository, "Fan Repair", "Ceiling and exhaust fan repair", new BigDecimal("299.00"), 60, electrical);
        
        // Appliances
        seedService(serviceRepository, "RO Repair", "Reverse Osmosis water purifier repair", new BigDecimal("499.00"), 90, appliances);
        seedService(serviceRepository, "RO Installation", "RO water purifier installation", new BigDecimal("399.00"), 60, appliances);
        seedService(serviceRepository, "RO Maintenance", "Routine RO maintenance and filter change", new BigDecimal("599.00"), 90, appliances);
        seedService(serviceRepository, "AC Repair", "Air conditioner repair service", new BigDecimal("699.00"), 120, appliances);
        seedService(serviceRepository, "AC Installation", "Air conditioner installation service", new BigDecimal("1499.00"), 180, appliances);
        seedService(serviceRepository, "AC Maintenance", "Routine AC servicing and cleaning", new BigDecimal("599.00"), 90, appliances);
        seedService(serviceRepository, "Refrigerator Repair", "Refrigerator repair and maintenance", new BigDecimal("599.00"), 90, appliances);
        seedService(serviceRepository, "Washing Machine Repair", "Washing machine repair service", new BigDecimal("599.00"), 90, appliances);
    }

    private ServiceCategory seedCategory(ServiceCategoryRepository categoryRepository, String name, String description) {
        return categoryRepository.findByNameIgnoreCase(name).orElseGet(() -> {
            ServiceCategory category = new ServiceCategory();
            category.setName(name);
            category.setDescription(description);
            category.setActive(true);
            return categoryRepository.save(category);
        });
    }

    private Service seedService(ServiceRepository serviceRepository, String name, String description, BigDecimal price, Integer durationMinutes, ServiceCategory category) {
        return serviceRepository.findByActiveTrueOrderByNameAsc()
                .stream()
                .filter(service -> service.getName().equalsIgnoreCase(name))
                .findFirst()
                .orElseGet(() -> {
                    Service serviceEntity = new Service();
                    serviceEntity.setName(name);
                    serviceEntity.setDescription(description);
                    serviceEntity.setPrice(price);
                    serviceEntity.setDurationMinutes(durationMinutes);
                    serviceEntity.setCategory(category);
                    serviceEntity.setActive(true);
                    return serviceRepository.save(serviceEntity);
                });
    }

    private void seedProviderData(UserRepository userRepository,
                                  ServiceRepository serviceRepository,
                                  ProviderProfileRepository providerProfileRepository,
                                  ProviderServiceRepository providerServiceRepository,
                                  AvailabilitySlotRepository availabilitySlotRepository) {

        setupProviderProfileAndServices(userRepository, providerProfileRepository, providerServiceRepository, availabilitySlotRepository,
                "ro@taaskr.com", 4.8, 45, 5, "RO water purifier specialist",
                serviceRepository, List.of("RO Repair", "RO Installation", "RO Maintenance"));

        setupProviderProfileAndServices(userRepository, providerProfileRepository, providerServiceRepository, availabilitySlotRepository,
                "ac@taaskr.com", 4.6, 32, 4, "AC repair and maintenance expert",
                serviceRepository, List.of("AC Repair", "AC Installation", "AC Maintenance"));

        setupProviderProfileAndServices(userRepository, providerProfileRepository, providerServiceRepository, availabilitySlotRepository,
                "electrician@taaskr.com", 4.9, 120, 8, "Licensed electrician for all home needs",
                serviceRepository, List.of("Switch Board Repair", "Fan Repair"));

        setupProviderProfileAndServices(userRepository, providerProfileRepository, providerServiceRepository, availabilitySlotRepository,
                "plumber@taaskr.com", 4.5, 60, 6, "Experienced plumber",
                serviceRepository, List.of("Tap Repair", "Pipe Leakage Fix"));

        setupProviderProfileAndServices(userRepository, providerProfileRepository, providerServiceRepository, availabilitySlotRepository,
                "appliance@taaskr.com", 4.7, 85, 7, "Multi-brand appliance repair expert",
                serviceRepository, List.of("Refrigerator Repair", "Washing Machine Repair", "RO Repair"));

        setupProviderProfileAndServices(userRepository, providerProfileRepository, providerServiceRepository, availabilitySlotRepository,
                "provider@taaskr.com", 4.7, 12, 3, "Experienced home service professional",
                serviceRepository, List.of("Tap Repair", "Bathroom Cleaning", "Full Home Cleaning"));
    }

    private void setupProviderProfileAndServices(UserRepository userRepository,
                                                 ProviderProfileRepository providerProfileRepository,
                                                 ProviderServiceRepository providerServiceRepository,
                                                 AvailabilitySlotRepository availabilitySlotRepository,
                                                 String email, double rating, int totalJobs, int experienceYears, String bio,
                                                 ServiceRepository serviceRepository,
                                                 List<String> serviceNames) {
        
        User providerUser = userRepository.findByEmail(email).orElse(null);
        if (providerUser == null) return;

        ProviderProfile providerProfile = providerProfileRepository.findByUserId(providerUser.getId())
                .orElseGet(() -> {
                    ProviderProfile profile = new ProviderProfile();
                    profile.setUser(providerUser);
                    profile.setExperienceYears(experienceYears);
                    profile.setCity(providerUser.getCity());
                    profile.setPincode(providerUser.getPincode());
                    profile.setApproved(true);
                    profile.setRating(rating);
                    profile.setTotalJobs(totalJobs);
                    profile.setBio(bio);
                    return providerProfileRepository.save(profile);
                });

        List<Service> allServices = serviceRepository.findByActiveTrueOrderByNameAsc();
        for (String serviceName : serviceNames) {
            allServices.stream()
                    .filter(s -> s.getName().equalsIgnoreCase(serviceName))
                    .findFirst()
                    .ifPresent(service -> {
                        boolean mappingExists = providerServiceRepository.findByProviderId(providerProfile.getId())
                                .stream()
                                .anyMatch(ps -> ps.getService().getId().equals(service.getId()));

                        if (!mappingExists) {
                            ProviderService providerService = new ProviderService();
                            providerService.setProvider(providerProfile);
                            providerService.setService(service);
                            providerServiceRepository.save(providerService);
                        }
                    });
        }

        LocalDate tomorrow = LocalDate.now().plusDays(1);
        seedAvailabilitySlot(availabilitySlotRepository, providerProfile, tomorrow, LocalTime.of(9, 0), LocalTime.of(11, 0));
        seedAvailabilitySlot(availabilitySlotRepository, providerProfile, tomorrow, LocalTime.of(11, 30), LocalTime.of(13, 30));
        seedAvailabilitySlot(availabilitySlotRepository, providerProfile, tomorrow, LocalTime.of(15, 0), LocalTime.of(18, 0));
        
        LocalDate dayAfter = LocalDate.now().plusDays(2);
        seedAvailabilitySlot(availabilitySlotRepository, providerProfile, dayAfter, LocalTime.of(10, 0), LocalTime.of(14, 0));
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