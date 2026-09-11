package com.taaskr.repository;

import com.taaskr.entity.UserFavoriteService;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserFavoriteServiceRepository extends JpaRepository<UserFavoriteService, Long> {
    List<UserFavoriteService> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<UserFavoriteService> findByUserIdAndServiceId(Long userId, Long serviceId);
    boolean existsByUserIdAndServiceId(Long userId, Long serviceId);
    void deleteByUserIdAndServiceId(Long userId, Long serviceId);
}
