package com.taaskr.config;

import com.taaskr.entity.User;
import com.taaskr.enums.Role;
import com.taaskr.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@Profile("prod")
public class ProductionAdminBootstrap {

    @Bean
    CommandLineRunner bootstrapProductionAdmin(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${ADMIN_EMAIL:}") String email,
            @Value("${ADMIN_PASSWORD:}") String password,
            @Value("${ADMIN_PHONE:}") String phone,
            @Value("${ADMIN_NAME:Taaskr Administrator}") String name,
            @Value("${ADMIN_CITY:}") String city,
            @Value("${ADMIN_PINCODE:}") String pincode) {
        return args -> {
            if (email.isBlank() && password.isBlank() && phone.isBlank()) {
                return;
            }

            if (email.isBlank() || password.isBlank() || phone.isBlank()) {
                throw new IllegalStateException(
                        "ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_PHONE must all be set when bootstrapping a production admin");
            }

            if (userRepository.existsByEmail(email)) {
                return;
            }

            User admin = new User();
            admin.setName(name);
            admin.setEmail(email);
            admin.setPassword(passwordEncoder.encode(password));
            admin.setPhone(phone);
            admin.setRole(Role.ADMIN);
            admin.setCity(city);
            admin.setPincode(pincode);
            admin.setEnabled(true);
            userRepository.save(admin);
        };
    }
}
