package com.taaskr.config;

import com.taaskr.entity.Service;
import com.taaskr.entity.ServiceCategory;
import com.taaskr.entity.User;
import com.taaskr.enums.Role;
import com.taaskr.repository.ServiceCategoryRepository;
import com.taaskr.repository.ServiceRepository;
import com.taaskr.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner seedData(UserRepository userRepository,
                               PasswordEncoder passwordEncoder,
                               ServiceCategoryRepository categoryRepository,
                               ServiceRepository serviceRepository) {
        return args -> {
            seedUsers(userRepository, passwordEncoder);
            seedCatalog(categoryRepository, serviceRepository);
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
}