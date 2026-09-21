package com.taaskr.repository;

import com.taaskr.entity.ProviderProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
@Repository
public interface ProviderProfileRepository extends JpaRepository<ProviderProfile, Long> {
    Optional<ProviderProfile> findByUserId(Long userId);
    List<ProviderProfile> findByApprovedFalseOrderByIdAsc();
    long countByApprovedFalse();
    List<ProviderProfile> findAllByOrderByIdAsc();

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("SELECT p FROM ProviderProfile p WHERE p.id = :id")
    Optional<ProviderProfile> findByIdWithLock(@org.springframework.data.repository.query.Param("id") Long id);
}
