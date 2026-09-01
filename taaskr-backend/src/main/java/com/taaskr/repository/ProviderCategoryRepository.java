package com.taaskr.repository;

import com.taaskr.entity.ProviderCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProviderCategoryRepository extends JpaRepository<ProviderCategory, Long> {
    List<ProviderCategory> findByProviderId(Long providerId);
    List<ProviderCategory> findByCategoryId(Long categoryId);
    Optional<ProviderCategory> findByProviderIdAndCategoryId(Long providerId, Long categoryId);
    void deleteByProviderId(Long providerId);
}
