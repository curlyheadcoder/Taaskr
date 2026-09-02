package com.taaskr.config;

import com.taaskr.entity.*;
import com.taaskr.enums.FuelType;
import com.taaskr.enums.Role;
import com.taaskr.enums.VehicleType;
import com.taaskr.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Configuration
@ConditionalOnProperty(name = "app.seed.demo-data", havingValue = "true")
public class DataSeeder {

    @Bean
    CommandLineRunner seedData(UserRepository userRepository,
                               PasswordEncoder passwordEncoder,
                               ServiceCategoryRepository categoryRepository,
                               ServiceRepository serviceRepository,
                               ProviderProfileRepository providerProfileRepository,
                               ProviderServiceRepository providerServiceRepository,
                               AvailabilitySlotRepository availabilitySlotRepository,
                               VehicleRepository vehicleRepository,
                               VehiclePricingRuleRepository vehiclePricingRuleRepository,
                               org.springframework.transaction.support.TransactionTemplate transactionTemplate) {
        return args -> {
            transactionTemplate.execute(status -> {
                seedUsers(userRepository, passwordEncoder);
                seedCatalog(categoryRepository, serviceRepository);
                seedVehiclePricingRules(vehiclePricingRuleRepository);
                seedProviderData(userRepository, serviceRepository, providerProfileRepository, providerServiceRepository, availabilitySlotRepository, vehicleRepository);
                return null;
            });
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
        seedUser(userRepository, passwordEncoder, "Security Systems Expert", "security@taaskr.com", "Provider@123", "8880000001", Role.PROVIDER, "Indore", "452001");
        seedUser(userRepository, passwordEncoder, "Security Guard Agency", "guard@taaskr.com", "Provider@123", "8880000002", Role.PROVIDER, "Indore", "452001");

        // Dedicated Driver Providers
        seedUser(userRepository, passwordEncoder, "Driver Ramesh (Mini Truck)", "driver.ramesh@taaskr.com", "Provider@123", "8880000003", Role.PROVIDER, "Indore", "452001");
        seedUser(userRepository, passwordEncoder, "Driver Suresh (Loading 3W)", "driver.suresh@taaskr.com", "Provider@123", "8880000004", Role.PROVIDER, "Indore", "452001");
        seedUser(userRepository, passwordEncoder, "Driver Ajay (E-Bike Courier)", "driver.ajay@taaskr.com", "Provider@123", "8880000005", Role.PROVIDER, "Indore", "452001");
    }

    private User seedUser(UserRepository userRepository, PasswordEncoder passwordEncoder, String name, String email, String rawPassword, String phone, Role role, String city, String pincode) {
        return userRepository.findByEmail(email).orElseGet(() -> {
            User user = new User();
            user.setName(name);
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode(rawPassword));
            user.setPhone(findAvailablePhone(userRepository, phone, email));
            user.setRole(role);
            user.setCity(city);
            user.setPincode(pincode);
            user.setEnabled(true);
            return userRepository.save(user);
        });
    }

    private String findAvailablePhone(UserRepository userRepository, String preferredPhone, String email) {
        if (!userRepository.existsByPhone(preferredPhone)) {
            return preferredPhone;
        }

        long candidate = 7_000_000_000L + Math.floorMod(email.hashCode(), 999_999_999);
        while (userRepository.existsByPhone(Long.toString(candidate))) {
            candidate++;
        }
        return Long.toString(candidate);
    }

    private void seedCatalog(ServiceCategoryRepository categoryRepository, ServiceRepository serviceRepository) {
        ServiceCategory plumbing = seedCategory(categoryRepository, "Plumbing", "Home plumbing repair and installation services");
        ServiceCategory cleaning = seedCategory(categoryRepository, "Cleaning", "Home and deep cleaning services");
        ServiceCategory electrical = seedCategory(categoryRepository, "Electrical", "Electrical repair and fitting services");
        ServiceCategory appliances = seedCategory(categoryRepository, "Appliances", "Home appliance repair and maintenance");
        ServiceCategory security = seedCategory(categoryRepository, "Security Services", "Home security installation and protection services");

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

        // Security Services
        seedService(serviceRepository, "CCTV Installation", "Install and configure CCTV cameras for your home", new BigDecimal("1199.00"), 120, security);
        seedService(serviceRepository, "Smart Lock Installation", "Install and set up a smart door lock", new BigDecimal("799.00"), 90, security);
        seedService(serviceRepository, "Video Doorbell Installation", "Install and configure a video doorbell", new BigDecimal("899.00"), 90, security);
        seedService(serviceRepository, "Security Guard Service", "Professional security guard service for your premises", new BigDecimal("1499.00"), 480, security);

        ServiceCategory diagnostic = seedCategory(categoryRepository, "Diagnostic Services", "Convenient diagnostic tests and sample collection at your doorstep.");
        ServiceCategory healthcare = seedCategory(categoryRepository, "Healthcare Services", "At-home healthcare assistance and basic patient care services.");
        ServiceCategory civil = seedCategory(categoryRepository, "Civil & Property Maintenance", "Construction, renovation, repair, and property maintenance services.");

        // Diagnostic Services
        seedService(serviceRepository, "Blood Test & Sample Collection", "At-home blood test and sample collection", new BigDecimal("499.00"), 30, diagnostic);
        seedService(serviceRepository, "Full Body Health Checkup", "Comprehensive full body checkup package", new BigDecimal("1999.00"), 60, diagnostic);
        seedService(serviceRepository, "Home Diagnostic Test", "Various home diagnostic tests and screenings", new BigDecimal("999.00"), 45, diagnostic);

        // Healthcare Services
        seedService(serviceRepository, "Compounder on Call", "Healthcare assistance for basic patient care and prescribed medication support at home.", new BigDecimal("599.00"), 60, healthcare);

        // Civil & Property Maintenance
        seedService(serviceRepository, "Masonry & Brickwork", "Professional masonry and brickwork services", new BigDecimal("899.00"), 240, civil);
        seedService(serviceRepository, "Waterproofing", "Roof and bathroom waterproofing solutions", new BigDecimal("2499.00"), 360, civil);
        seedService(serviceRepository, "Flooring & Tiling", "Floor tiling and repair services", new BigDecimal("1499.00"), 480, civil);
        seedService(serviceRepository, "Roof & Terrace Maintenance", "Roof repair and terrace maintenance", new BigDecimal("1999.00"), 360, civil);
        seedService(serviceRepository, "Home Renovation", "General home renovation and remodeling", new BigDecimal("4999.00"), 480, civil);
        seedService(serviceRepository, "General Civil Repairs", "Minor civil repairs and wall plastering", new BigDecimal("799.00"), 120, civil);

        // On-Demand Intra-City Vehicle Service Category
        ServiceCategory vehicleCategory = seedCategory(categoryRepository, "On-Demand Vehicle", "Intra-city on-demand goods transport and vehicle with driver service.");
        seedService(serviceRepository, "Electric Bike", "Fast eco-friendly two-wheeler for small parcels and urgent documents", new BigDecimal("40.00"), 30, vehicleCategory);
        seedService(serviceRepository, "Petrol Bike", "Quick two-wheeler courier for lightweight goods and packages", new BigDecimal("45.00"), 30, vehicleCategory);
        seedService(serviceRepository, "Electric Rickshaw", "Electric 3-wheeler for medium boxes and multi-package local transport", new BigDecimal("90.00"), 45, vehicleCategory);
        seedService(serviceRepository, "Loading Vehicle", "Dedicated 3-wheeler loading tempo for appliances and furniture transport", new BigDecimal("150.00"), 60, vehicleCategory);
        seedService(serviceRepository, "Mini Truck", "Reliable mini truck (Tata Ace / Pickup) for home shifting & heavy goods", new BigDecimal("250.00"), 90, vehicleCategory);
        seedService(serviceRepository, "Truck", "Large 14ft/17ft truck for full house or office goods relocation", new BigDecimal("600.00"), 120, vehicleCategory);
        seedService(serviceRepository, "Heavy Truck", "Heavy-duty commercial vehicle for heavy machinery and bulk items", new BigDecimal("1200.00"), 180, vehicleCategory);
    }

    private void seedVehiclePricingRules(VehiclePricingRuleRepository ruleRepository) {
        seedRule(ruleRepository, VehicleType.TWO_WHEELER_ELECTRIC, "Electric Bike", new BigDecimal("40.00"), new BigDecimal("2.0"), new BigDecimal("12.00"), new BigDecimal("40.00"), new BigDecimal("20.00"));
        seedRule(ruleRepository, VehicleType.TWO_WHEELER_PETROL, "Petrol Bike", new BigDecimal("45.00"), new BigDecimal("2.0"), new BigDecimal("14.00"), new BigDecimal("45.00"), new BigDecimal("25.00"));
        seedRule(ruleRepository, VehicleType.THREE_WHEELER_ELECTRIC, "Electric Rickshaw", new BigDecimal("90.00"), new BigDecimal("2.0"), new BigDecimal("20.00"), new BigDecimal("90.00"), new BigDecimal("250.00"));
        seedRule(ruleRepository, VehicleType.LOADING_VEHICLE, "Loading Vehicle (3W)", new BigDecimal("150.00"), new BigDecimal("2.0"), new BigDecimal("25.00"), new BigDecimal("150.00"), new BigDecimal("500.00"));
        seedRule(ruleRepository, VehicleType.MINI_TRUCK, "Mini Truck (Tata Ace)", new BigDecimal("250.00"), new BigDecimal("3.0"), new BigDecimal("32.00"), new BigDecimal("250.00"), new BigDecimal("1000.00"));
        seedRule(ruleRepository, VehicleType.TRUCK, "Truck (14ft / 17ft)", new BigDecimal("600.00"), new BigDecimal("5.0"), new BigDecimal("50.00"), new BigDecimal("600.00"), new BigDecimal("2500.00"));
        seedRule(ruleRepository, VehicleType.HEAVY_TRUCK, "Heavy Truck", new BigDecimal("1200.00"), new BigDecimal("5.0"), new BigDecimal("85.00"), new BigDecimal("1200.00"), new BigDecimal("7000.00"));
    }

    private void seedRule(VehiclePricingRuleRepository repository, VehicleType type, String name, BigDecimal baseFare, BigDecimal baseDistance, BigDecimal perKmRate, BigDecimal minFare, BigDecimal maxCapacity) {
        if (repository.findByVehicleType(type).isEmpty()) {
            VehiclePricingRule rule = new VehiclePricingRule(type, name, baseFare, baseDistance, perKmRate, minFare, maxCapacity);
            repository.save(rule);
        }
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
                                  AvailabilitySlotRepository availabilitySlotRepository,
                                  VehicleRepository vehicleRepository) {

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
                "provider@taaskr.com", 4.7, 12, 3, "Experienced home service and vehicle transport partner",
                serviceRepository, List.of("Tap Repair", "Bathroom Cleaning", "Mini Truck"));

        setupProviderProfileAndServices(userRepository, providerProfileRepository, providerServiceRepository, availabilitySlotRepository,
                "security@taaskr.com", 4.8, 38, 6, "Certified home security and surveillance systems specialist",
                serviceRepository, List.of("CCTV Installation", "Smart Lock Installation", "Video Doorbell Installation"));

        setupProviderProfileAndServices(userRepository, providerProfileRepository, providerServiceRepository, availabilitySlotRepository,
                "guard@taaskr.com", 4.6, 54, 5, "Professional residential and event security guard provider",
                serviceRepository, List.of("Security Guard Service"));

        // Driver Providers setup
        ProviderProfile ramesh = setupProviderProfileAndServices(userRepository, providerProfileRepository, providerServiceRepository, availabilitySlotRepository,
                "driver.ramesh@taaskr.com", 4.9, 88, 5, "Professional commercial driver for Tata Ace Mini Truck intra-city goods moving",
                serviceRepository, List.of("Mini Truck", "Loading Vehicle"));
        if (ramesh != null) {
            seedDriverVehicle(vehicleRepository, ramesh, VehicleType.MINI_TRUCK, FuelType.DIESEL, "Tata Ace Gold", "MP-09-TA-1001", new BigDecimal("1000.00"), new BigDecimal("22.7196"), new BigDecimal("75.8577"));
        }

        ProviderProfile suresh = setupProviderProfileAndServices(userRepository, providerProfileRepository, providerServiceRepository, availabilitySlotRepository,
                "driver.suresh@taaskr.com", 4.7, 62, 4, "Reliable 3-wheeler loading tempo driver for furniture and heavy boxes",
                serviceRepository, List.of("Loading Vehicle", "Electric Rickshaw"));
        if (suresh != null) {
            seedDriverVehicle(vehicleRepository, suresh, VehicleType.LOADING_VEHICLE, FuelType.CNG, "Piaggio Ape Auto Plus", "MP-09-LD-2002", new BigDecimal("500.00"), new BigDecimal("22.7244"), new BigDecimal("75.8839"));
        }

        ProviderProfile ajay = setupProviderProfileAndServices(userRepository, providerProfileRepository, providerServiceRepository, availabilitySlotRepository,
                "driver.ajay@taaskr.com", 4.8, 140, 3, "Fast EV two-wheeler parcel and document courier partner",
                serviceRepository, List.of("Electric Bike", "Petrol Bike"));
        if (ajay != null) {
            seedDriverVehicle(vehicleRepository, ajay, VehicleType.TWO_WHEELER_ELECTRIC, FuelType.ELECTRIC, "Hero Electric Nyx", "MP-09-EV-3003", new BigDecimal("25.00"), new BigDecimal("22.7533"), new BigDecimal("75.8937"));
        }
    }

    private void seedDriverVehicle(VehicleRepository vehicleRepository, ProviderProfile provider, VehicleType type, FuelType fuel, String model, String plate, BigDecimal capacity, BigDecimal lat, BigDecimal lng) {
        if (vehicleRepository.findByProviderId(provider.getId()).isEmpty()) {
            Vehicle vehicle = new Vehicle();
            vehicle.setProvider(provider);
            vehicle.setVehicleType(type);
            vehicle.setFuelType(fuel);
            vehicle.setModelName(model);
            vehicle.setRegistrationNumber(plate);
            vehicle.setCapacityKg(capacity);
            vehicle.setActive(true);
            vehicle.setAvailable(true);
            vehicle.setCurrentLatitude(lat);
            vehicle.setCurrentLongitude(lng);
            vehicleRepository.save(vehicle);
        }
    }

    private ProviderProfile setupProviderProfileAndServices(UserRepository userRepository,
                                                            ProviderProfileRepository providerProfileRepository,
                                                            ProviderServiceRepository providerServiceRepository,
                                                            AvailabilitySlotRepository availabilitySlotRepository,
                                                            String email, double rating, int totalJobs, int experienceYears, String bio,
                                                            ServiceRepository serviceRepository,
                                                            List<String> serviceNames) {
        
        User providerUser = userRepository.findByEmail(email).orElse(null);
        if (providerUser == null) return null;

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
        for (int i = 1; i <= 7; i++) {
            LocalDate availableDate = LocalDate.now().plusDays(i);
            seedAvailabilitySlot(availabilitySlotRepository, providerProfile, availableDate, LocalTime.of(9, 0), LocalTime.of(11, 0));
            seedAvailabilitySlot(availabilitySlotRepository, providerProfile, availableDate, LocalTime.of(11, 30), LocalTime.of(13, 30));
        }
        seedAvailabilitySlot(availabilitySlotRepository, providerProfile, tomorrow, LocalTime.of(15, 0), LocalTime.of(18, 0));
        
        LocalDate dayAfter = LocalDate.now().plusDays(2);
        seedAvailabilitySlot(availabilitySlotRepository, providerProfile, dayAfter, LocalTime.of(10, 0), LocalTime.of(14, 0));

        return providerProfile;
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
