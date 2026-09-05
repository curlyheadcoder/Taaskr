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
        seedUser(userRepository, passwordEncoder, "Aarav Sharma", "admin@taaskr.com", "Admin@123", "9999999991", Role.ADMIN, "Indore", "452001");
        seedUser(userRepository, passwordEncoder, "Rahul Verma", "user@taaskr.com", "User@123", "9999999992", Role.USER, "Indore", "452001");
        
        // Seed multiple verified Indian service providers & technicians
        seedUser(userRepository, passwordEncoder, "Rajesh Patel", "provider@taaskr.com", "Provider@123", "9999999993", Role.PROVIDER, "Indore", "452001");
        seedUser(userRepository, passwordEncoder, "Manoj Kumar (RO Specialist)", "ro@taaskr.com", "Provider@123", "9999999994", Role.PROVIDER, "Indore", "452001");
        seedUser(userRepository, passwordEncoder, "Vikram Singh (HVAC Specialist)", "ac@taaskr.com", "Provider@123", "9999999995", Role.PROVIDER, "Indore", "452010");
        seedUser(userRepository, passwordEncoder, "Amit Sharma (Master Electrician)", "electrician@taaskr.com", "Provider@123", "9999999996", Role.PROVIDER, "Indore", "452001");
        seedUser(userRepository, passwordEncoder, "Dinesh Gupta (Senior Plumber)", "plumber@taaskr.com", "Provider@123", "9999999997", Role.PROVIDER, "Indore", "452002");
        seedUser(userRepository, passwordEncoder, "Suresh Verma (Appliance Expert)", "appliance@taaskr.com", "Provider@123", "9999999998", Role.PROVIDER, "Indore", "452001");
        seedUser(userRepository, passwordEncoder, "Pooja Sharma (Salon & Beauty Expert)", "salon@taaskr.com", "Provider@123", "9999999999", Role.PROVIDER, "Indore", "452001");
        seedUser(userRepository, passwordEncoder, "Pankaj Malviya (Pest Control Expert)", "pest@taaskr.com", "Provider@123", "8880000010", Role.PROVIDER, "Indore", "452001");
        seedUser(userRepository, passwordEncoder, "Kailash Sharma (Master Carpenter)", "carpenter@taaskr.com", "Provider@123", "8880000011", Role.PROVIDER, "Indore", "452001");
        seedUser(userRepository, passwordEncoder, "Sunil Jain (Hardware & Tech Expert)", "tech@taaskr.com", "Provider@123", "8880000012", Role.PROVIDER, "Indore", "452001");
        seedUser(userRepository, passwordEncoder, "Gopal Lodhi (Auto Detailing Specialist)", "autocare@taaskr.com", "Provider@123", "8880000013", Role.PROVIDER, "Indore", "452001");
        seedUser(userRepository, passwordEncoder, "Sunita Bai (Home Help & Cook)", "homehelp@taaskr.com", "Provider@123", "8880000014", Role.PROVIDER, "Indore", "452001");
        seedUser(userRepository, passwordEncoder, "Sister Anita Joseph (Elderly Care Nurse)", "nurse@taaskr.com", "Provider@123", "8880000015", Role.PROVIDER, "Indore", "452001");
        seedUser(userRepository, passwordEncoder, "Ravi Shankar (CCTV & Security)", "security@taaskr.com", "Provider@123", "8880000001", Role.PROVIDER, "Indore", "452001");
        seedUser(userRepository, passwordEncoder, "Devendra Rathore (Security Guard)", "guard@taaskr.com", "Provider@123", "8880000002", Role.PROVIDER, "Indore", "452001");

        // Dedicated Driver Providers
        seedUser(userRepository, passwordEncoder, "Ramesh Gurjar (Mini Truck Driver)", "driver.ramesh@taaskr.com", "Provider@123", "8880000003", Role.PROVIDER, "Indore", "452001");
        seedUser(userRepository, passwordEncoder, "Suresh Yadav (3W Loading Driver)", "driver.suresh@taaskr.com", "Provider@123", "8880000004", Role.PROVIDER, "Indore", "452001");
        seedUser(userRepository, passwordEncoder, "Ajay Rathore (Express Courier)", "driver.ajay@taaskr.com", "Provider@123", "8880000005", Role.PROVIDER, "Indore", "452001");
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
            user.setEmailVerified(true);
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
        ServiceCategory plumbingCleaning = seedCategory(categoryRepository, "Plumbing & Cleaning", "Home plumbing repairs, pipe leakage fixes, drain cleaning, and deep sanitization services");
        ServiceCategory appliancesElectrical = seedCategory(categoryRepository, "Appliances & Electrical", "Home appliance repair, AC maintenance, geyser servicing, and electrical wiring");
        ServiceCategory pestControl = seedCategory(categoryRepository, "Pest Control", "Eco-friendly, odorless pest, cockroach, termite, and bed bug eradication treatments");
        ServiceCategory salonWellness = seedCategory(categoryRepository, "Salon & Massage / Wellness", "Professional doorstep grooming, beauty, hair styling, and relaxing massage therapies for men and women");
        ServiceCategory civil = seedCategory(categoryRepository, "Civil & Property Maintenance", "Carpentry, drilling, wall painting, masonry, waterproofing, and renovation services");
        ServiceCategory techElectronics = seedCategory(categoryRepository, "Tech & Home Automation", "Laptop diagnostics, Wi-Fi router setup, smart TV mounting, and printer repair");
        ServiceCategory vehicleAuto = seedCategory(categoryRepository, "Vehicle & Auto Care", "Doorstep car/bike foam wash, detailing, and emergency battery jump start assistance");
        ServiceCategory homeHelp = seedCategory(categoryRepository, "Home Help & Errand Services", "On-demand cooks, domestic helpers, laundry, urgent medicine, and grocery pickups");
        ServiceCategory security = seedCategory(categoryRepository, "Security Services", "Home security CCTV installation, smart locks, and verified security guard protection");
        ServiceCategory diagnosticHealthcare = seedCategory(categoryRepository, "Diagnostic & Healthcare Services", "Doorstep blood tests, full body checkups, compounder nursing, and elderly care assistance");
        ServiceCategory vehicleCategory = seedCategory(categoryRepository, "On-Demand Vehicle", "Intra-city on-demand goods transport and vehicle with driver service.");

        // 1. Plumbing & Cleaning
        seedService(serviceRepository, "Tap Leakage & Valve Repair", "Fix leaking or damaged taps and replace worn washers", new BigDecimal("299.00"), 60, plumbingCleaning);
        seedService(serviceRepository, "Pipe Leakage Fix", "Detect and repair concealed or open pipe leakages", new BigDecimal("499.00"), 90, plumbingCleaning);
        seedService(serviceRepository, "Drain Blockage & Clog Clearance", "Mechanical spring clearing for clogged kitchen sinks, washbasins, and bathroom drain traps", new BigDecimal("399.00"), 60, plumbingCleaning);
        seedService(serviceRepository, "Bathroom Deep Cleaning & Sanitization", "Deep tile scrub, lime stain removal, and sanitaryware disinfection", new BigDecimal("399.00"), 90, plumbingCleaning);
        seedService(serviceRepository, "Kitchen Deep Cleaning & Chimney Degreasing", "Thorough degreasing of chimney filters, gas stove scrub, and kitchen oil stain removal", new BigDecimal("799.00"), 120, plumbingCleaning);
        seedService(serviceRepository, "Sofa & Carpet Shampooing", "High-suction wet extraction shampooing for fabric sofas, cushions, and floor carpets", new BigDecimal("699.00"), 90, plumbingCleaning);
        seedService(serviceRepository, "Full Home Cleaning", "Complete multi-room deep cleaning, floor scrubbing, and dusting", new BigDecimal("1499.00"), 240, plumbingCleaning);
        
        // 2. Appliances & Electrical
        seedService(serviceRepository, "Switchboard & Wiring Repair", "Repair or replace faulty switch boards, tripped MCBs, and wiring", new BigDecimal("349.00"), 60, appliancesElectrical);
        seedService(serviceRepository, "Ceiling & Exhaust Fan Repair", "Ceiling and exhaust fan motor, capacitor, and regulator repair", new BigDecimal("299.00"), 60, appliancesElectrical);
        seedService(serviceRepository, "Geyser & Water Heater Servicing", "Element descaling, thermostat inspection, and leak repairs for storage/instant geysers", new BigDecimal("449.00"), 60, appliancesElectrical);
        seedService(serviceRepository, "Inverter & Battery Servicing", "Battery distilled water top-up, terminal desulfation, and inverter load testing", new BigDecimal("349.00"), 45, appliancesElectrical);
        seedService(serviceRepository, "Microwave & OTG Repair", "Magnetron check, high-voltage fuse change, and rotating plate motor repair", new BigDecimal("399.00"), 60, appliancesElectrical);
        seedService(serviceRepository, "RO Water Purifier Service", "Reverse Osmosis water purifier pump, filter change, and TDS calibration", new BigDecimal("499.00"), 90, appliancesElectrical);
        seedService(serviceRepository, "AC Repair & Service", "Air conditioner cooling diagnostics, gas leak check, and coil cleaning", new BigDecimal("699.00"), 120, appliancesElectrical);
        seedService(serviceRepository, "Refrigerator Repair", "Single/double door refrigerator cooling, compressor, and defrost repair", new BigDecimal("599.00"), 90, appliancesElectrical);
        seedService(serviceRepository, "Washing Machine Repair", "Automatic/semi-automatic washing machine drum, drain pump, and PCB servicing", new BigDecimal("599.00"), 90, appliancesElectrical);

        // 3. Pest Control
        seedService(serviceRepository, "General Pest & Cockroach Control", "Odorless herbal gel baiting and spray targeting cockroaches, ants, and silverfish with 90-day warranty", new BigDecimal("899.00"), 90, pestControl);
        seedService(serviceRepository, "Termite & Wood Borer Treatment", "Chemical barrier drill-and-fill treatment protecting wooden structures against subterranean termites", new BigDecimal("1899.00"), 180, pestControl);
        seedService(serviceRepository, "Bed Bug Eradication Treatment", "Two-round high-potency chemical spray treatment targeting mattress seams and sofa crevices", new BigDecimal("1199.00"), 120, pestControl);
        seedService(serviceRepository, "Mosquito & Flying Insect Control", "Cold-fogging and residual wall misting to eliminate adult mosquitoes and larvae", new BigDecimal("799.00"), 60, pestControl);

        // 4. Salon & Massage / Wellness (Unisex: Men & Women)
        seedService(serviceRepository, "Men's Haircut & Beard Styling", "Doorstep hygienic haircut, beard trimming, styling, and disposable kit protocol", new BigDecimal("349.00"), 45, salonWellness);
        seedService(serviceRepository, "Women's Haircut & Hair Spa", "Professional precision haircut, deep conditioning hair spa, and blowout styling at home", new BigDecimal("699.00"), 60, salonWellness);
        seedService(serviceRepository, "At-Home Manicure & Pedicure", "Relaxing cuticle care, scrub, foot massage, and polish using sterile tools", new BigDecimal("599.00"), 60, salonWellness);
        seedService(serviceRepository, "Full Arms & Legs Waxing", "Hygienic RICA / honey waxing with post-wax soothing lotion application", new BigDecimal("499.00"), 45, salonWellness);
        seedService(serviceRepository, "Bridal & Party Makeup at Home", "HD glam and party makeover by certified makeup artists using premium cosmetics", new BigDecimal("1499.00"), 90, salonWellness);
        seedService(serviceRepository, "At-Home Facial & Skin Glow", "Deep pore cleansing, tan removal scrub, steam, and herbal face pack for all skin types", new BigDecimal("799.00"), 60, salonWellness);
        seedService(serviceRepository, "Head, Neck & Shoulder Massage", "Stress-relief acupressure therapy using soothing warm herbal oils", new BigDecimal("499.00"), 45, salonWellness);
        seedService(serviceRepository, "Full Body Stress Relief Therapy", "Rejuvenating full body Swedish / Ayurvedic oil massage by certified wellness therapists", new BigDecimal("1299.00"), 90, salonWellness);

        // 5. Civil & Property Maintenance
        seedService(serviceRepository, "Carpentry & Furniture Repair", "Fixing misaligned cabinet hinges, drawer channels, hydraulic bed lifts, and wooden doors", new BigDecimal("399.00"), 60, civil);
        seedService(serviceRepository, "Furniture Assembly & Flatpack Setup", "Assembly of flatpack wardrobes, beds, TV units, and study desks from IKEA/Amazon/Pepperfry", new BigDecimal("499.00"), 90, civil);
        seedService(serviceRepository, "Drilling, Hanging & Wall Mounting", "Precision hammer-drilling for wall art, mirrors, curtain rods, and bathroom towel racks", new BigDecimal("249.00"), 45, civil);
        seedService(serviceRepository, "Interior Wall Painting & Touch-up", "Putty filling, primer, and premium acrylic emulsion roller painting for rooms or accent walls", new BigDecimal("1499.00"), 240, civil);
        seedService(serviceRepository, "Masonry & Brickwork", "Professional masonry, brickwork, and plastering services", new BigDecimal("899.00"), 240, civil);
        seedService(serviceRepository, "Waterproofing", "Roof slab, terrace, and bathroom waterproofing chemical coating", new BigDecimal("2499.00"), 360, civil);
        seedService(serviceRepository, "Flooring & Tiling", "Floor tiling, regrouting, and cracked tile repair services", new BigDecimal("1499.00"), 480, civil);
        seedService(serviceRepository, "Roof & Terrace Maintenance", "Terrace inspection, rain drain clearing, and protective heat-reflective coating", new BigDecimal("1999.00"), 360, civil);
        seedService(serviceRepository, "Home Renovation", "General home civil restructuring, partition remodeling, and repairs", new BigDecimal("4999.00"), 480, civil);

        // 6. Tech & Home Automation
        seedService(serviceRepository, "Laptop & PC Diagnostics / OS Setup", "RAM/SSD upgrades, OS installation, virus cleanup, and thermal paste replacement", new BigDecimal("499.00"), 60, techElectronics);
        seedService(serviceRepository, "Wi-Fi Router & Mesh Network Setup", "High-speed fiber router installation, dead zone mesh repeater config, and security tuning", new BigDecimal("399.00"), 45, techElectronics);
        seedService(serviceRepository, "Smart TV & Home Theater Wall Setup", "Wall bracket mounting for 32-75 inch Smart TVs, soundbar setup, and cable concealment", new BigDecimal("599.00"), 60, techElectronics);
        seedService(serviceRepository, "Printer Setup & Troubleshooting", "Driver installation, wireless network printing setup, and paper feed troubleshooting", new BigDecimal("349.00"), 45, techElectronics);

        // 7. Vehicle & Auto Care
        seedService(serviceRepository, "Doorstep Eco Car Foam Wash & Vacuum", "Pressure foam wash, tire shine, and interior carpet/seat high-suction vacuuming at your parking spot", new BigDecimal("499.00"), 60, vehicleAuto);
        seedService(serviceRepository, "Doorstep Bike Foam Wash & Chain Lube", "Two-wheeler pressure foam wash, degreasing, and synthetic chain lubrication", new BigDecimal("249.00"), 45, vehicleAuto);
        seedService(serviceRepository, "Deep Car Interior Detailing & Polishing", "Fabric shampooing, leather conditioning, dashboard polish, and AC vent steam sanitization", new BigDecimal("1199.00"), 120, vehicleAuto);
        seedService(serviceRepository, "Car Battery Jump Start Assistance", "15-minute emergency roadside/home jumper cable restart and battery alternator check", new BigDecimal("349.00"), 30, vehicleAuto);

        // 8. Home Help & Errand Services
        seedService(serviceRepository, "Daily Domestic Helper / Maid on Demand", "Verified on-demand helper for sweeping, mopping, utensil cleaning, and kitchen surface wipe-down", new BigDecimal("399.00"), 120, homeHelp);
        seedService(serviceRepository, "Home Chef & Daily Cook on Demand", "Freshly prepared home-style vegetarian / non-vegetarian meals cooked at your kitchen", new BigDecimal("499.00"), 120, homeHelp);
        seedService(serviceRepository, "Doorstep Laundry & Steam Ironing", "Clothes wash, gentle fabric dry, and crisp wrinkle-free steam press pickup & drop", new BigDecimal("299.00"), 60, homeHelp);
        seedService(serviceRepository, "Urgent Medicine & Prescription Delivery", "Fast doorstep pickup of emergency medications from authorized local pharmacies", new BigDecimal("149.00"), 30, homeHelp);
        seedService(serviceRepository, "Local Grocery & Market Pickup Delivery", "Handpicked vegetables, fruits, and groceries purchased and delivered from nearby markets", new BigDecimal("199.00"), 45, homeHelp);
        seedService(serviceRepository, "Personal Errand & Queue Assistance", "On-demand assistant for document submission, standing in billing queues, and municipal errands", new BigDecimal("249.00"), 60, homeHelp);

        // 9. Security Services
        seedService(serviceRepository, "CCTV Installation", "Install and configure CCTV cameras with mobile live-view setup", new BigDecimal("1199.00"), 120, security);
        seedService(serviceRepository, "Smart Lock Installation", "Install and set up a biometric fingerprint and digital keypad smart lock", new BigDecimal("799.00"), 90, security);
        seedService(serviceRepository, "Video Doorbell Installation", "Install and configure wireless / wired video doorbell with two-way audio", new BigDecimal("899.00"), 90, security);
        seedService(serviceRepository, "Security Guard Service", "Professional, verified security guard shift for residential societies and commercial premises", new BigDecimal("1499.00"), 480, security);

        // 10. Diagnostic & Healthcare Services
        seedService(serviceRepository, "Blood Test & Sample Collection", "At-home phlebotomy sample collection with NABL certified laboratory analysis", new BigDecimal("499.00"), 30, diagnosticHealthcare);
        seedService(serviceRepository, "Full Body Health Checkup", "Comprehensive full body preventive health screening covering 60+ vital parameters", new BigDecimal("1999.00"), 60, diagnosticHealthcare);
        seedService(serviceRepository, "Home Diagnostic Test", "At-home vital checks, blood sugar profiling, and rapid diagnostic screenings", new BigDecimal("999.00"), 45, diagnosticHealthcare);
        seedService(serviceRepository, "Compounder on Call", "Healthcare assistance for basic patient care, IV infusion, dressing, and prescribed medication support", new BigDecimal("599.00"), 60, diagnosticHealthcare);
        seedService(serviceRepository, "Elderly Assistance & Hospital Escort", "Companion escort for senior citizens to doctor appointments, mobility aid, and clinic visits", new BigDecimal("799.00"), 180, diagnosticHealthcare);

        // 11. On-Demand Intra-City Vehicle Service Category (Logistics)
        seedService(serviceRepository, "Electric Bike", "Fast eco-friendly two-wheeler for small parcels and urgent documents", new BigDecimal("40.00"), 30, vehicleCategory);
        seedService(serviceRepository, "Petrol Bike", "Quick two-wheeler courier for lightweight goods and packages", new BigDecimal("45.00"), 30, vehicleCategory);
        seedService(serviceRepository, "Electric Rickshaw", "Electric 3-wheeler for medium boxes and multi-package local transport", new BigDecimal("90.00"), 45, vehicleCategory);
        seedService(serviceRepository, "Loading Vehicle", "Dedicated 3-wheeler loading tempo for appliances and furniture transport", new BigDecimal("150.00"), 60, vehicleCategory);
        seedService(serviceRepository, "Mini Truck", "Reliable mini truck (Tata Ace / Mahindra Bolero Pickup) for home shifting & furniture transport", new BigDecimal("250.00"), 90, vehicleCategory);
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
                serviceRepository, List.of("Tap Leakage & Valve Repair", "Pipe Leakage Fix", "Drain Blockage & Clog Clearance"));

        setupProviderProfileAndServices(userRepository, providerProfileRepository, providerServiceRepository, availabilitySlotRepository,
                "appliance@taaskr.com", 4.7, 85, 7, "Multi-brand appliance repair expert",
                serviceRepository, List.of("Refrigerator Repair", "Washing Machine Repair", "RO Water Purifier Service", "AC Repair & Service", "Switchboard & Wiring Repair"));

        setupProviderProfileAndServices(userRepository, providerProfileRepository, providerServiceRepository, availabilitySlotRepository,
                "electrician@taaskr.com", 4.8, 95, 8, "Licensed electrician for wiring, switches, and fans",
                serviceRepository, List.of("Switchboard & Wiring Repair", "Ceiling & Exhaust Fan Repair", "Inverter & Battery Servicing", "Geyser & Water Heater Servicing"));

        setupProviderProfileAndServices(userRepository, providerProfileRepository, providerServiceRepository, availabilitySlotRepository,
                "provider@taaskr.com", 4.7, 12, 3, "Experienced home service professional",
                serviceRepository, List.of("Tap Leakage & Valve Repair", "Bathroom Deep Cleaning & Sanitization", "Full Home Cleaning", "Sofa & Carpet Shampooing"));

        setupProviderProfileAndServices(userRepository, providerProfileRepository, providerServiceRepository, availabilitySlotRepository,
                "salon@taaskr.com", 4.9, 150, 7, "Certified unisex salon, bridal makeup, and relaxation therapist",
                serviceRepository, List.of("Men's Haircut & Beard Styling", "Women's Haircut & Hair Spa", "At-Home Manicure & Pedicure", "Full Arms & Legs Waxing", "Bridal & Party Makeup at Home", "At-Home Facial & Skin Glow", "Head, Neck & Shoulder Massage", "Full Body Stress Relief Therapy"));

        setupProviderProfileAndServices(userRepository, providerProfileRepository, providerServiceRepository, availabilitySlotRepository,
                "pest@taaskr.com", 4.8, 92, 6, "Government certified pest control operator with odorless green chemicals",
                serviceRepository, List.of("General Pest & Cockroach Control", "Termite & Wood Borer Treatment", "Bed Bug Eradication Treatment", "Mosquito & Flying Insect Control"));

        setupProviderProfileAndServices(userRepository, providerProfileRepository, providerServiceRepository, availabilitySlotRepository,
                "carpenter@taaskr.com", 4.7, 110, 8, "Master carpenter for custom woodwork, drilling, and furniture setup",
                serviceRepository, List.of("Carpentry & Furniture Repair", "Furniture Assembly & Flatpack Setup", "Drilling, Hanging & Wall Mounting", "Interior Wall Painting & Touch-up", "Masonry & Brickwork"));

        setupProviderProfileAndServices(userRepository, providerProfileRepository, providerServiceRepository, availabilitySlotRepository,
                "tech@taaskr.com", 4.9, 78, 5, "Hardware, Wi-Fi mesh networking, and smart TV mounting specialist",
                serviceRepository, List.of("Laptop & PC Diagnostics / OS Setup", "Wi-Fi Router & Mesh Network Setup", "Smart TV & Home Theater Wall Setup", "Printer Setup & Troubleshooting"));

        setupProviderProfileAndServices(userRepository, providerProfileRepository, providerServiceRepository, availabilitySlotRepository,
                "autocare@taaskr.com", 4.8, 65, 4, "Doorstep car & bike foam detailing and battery jump start technician",
                serviceRepository, List.of("Doorstep Eco Car Foam Wash & Vacuum", "Doorstep Bike Foam Wash & Chain Lube", "Deep Car Interior Detailing & Polishing", "Car Battery Jump Start Assistance"));

        setupProviderProfileAndServices(userRepository, providerProfileRepository, providerServiceRepository, availabilitySlotRepository,
                "homehelp@taaskr.com", 4.6, 140, 6, "Reliable home chef, daily domestic helper, and errand assistant",
                serviceRepository, List.of("Daily Domestic Helper / Maid on Demand", "Home Chef & Daily Cook on Demand", "Doorstep Laundry & Steam Ironing", "Urgent Medicine & Prescription Delivery", "Local Grocery & Market Pickup Delivery", "Personal Errand & Queue Assistance"));

        setupProviderProfileAndServices(userRepository, providerProfileRepository, providerServiceRepository, availabilitySlotRepository,
                "nurse@taaskr.com", 4.9, 88, 9, "Registered nursing professional for vitals, injections, and elderly care",
                serviceRepository, List.of("Blood Test & Sample Collection", "Full Body Health Checkup", "Home Diagnostic Test", "Compounder on Call", "Elderly Assistance & Hospital Escort"));

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
        if (vehicleRepository.findByRegistrationNumber(plate).isEmpty()) {
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
