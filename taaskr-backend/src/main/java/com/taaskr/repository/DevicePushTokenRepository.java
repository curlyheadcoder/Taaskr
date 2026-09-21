package com.taaskr.repository;

import com.taaskr.entity.DevicePushToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DevicePushTokenRepository extends JpaRepository<DevicePushToken, Long> {

    Optional<DevicePushToken> findByToken(String token);

    List<DevicePushToken> findByUserIdAndActiveTrue(Long userId);

    List<DevicePushToken> findByUserId(Long userId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE DevicePushToken d SET d.active = false WHERE d.user.id = :userId AND d.token = :token")
    void deactivateTokenForUser(Long userId, String token);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE DevicePushToken d SET d.active = false WHERE d.token = :token")
    void deactivateToken(String token);
}
