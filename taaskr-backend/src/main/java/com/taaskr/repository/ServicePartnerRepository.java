package com.taaskr.repository;

import com.taaskr.entity.ServicePartner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServicePartnerRepository extends JpaRepository<ServicePartner, Long> {

    List<ServicePartner> findByProviderId(Long providerId);

    List<ServicePartner> findByProviderIdAndActiveTrue(Long providerId);

    Optional<ServicePartner> findByUserId(Long userId);

    Optional<ServicePartner> findByIdAndProviderId(Long id, Long providerId);
}
