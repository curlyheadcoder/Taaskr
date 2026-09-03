package com.taaskr.repository;

import com.taaskr.entity.Vehicle;
import com.taaskr.enums.VehicleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

    Optional<Vehicle> findByProviderId(Long providerId);

    List<Vehicle> findAllByProviderId(Long providerId);

    Optional<Vehicle> findByIdAndProviderId(Long id, Long providerId);

    void deleteByIdAndProviderId(Long id, Long providerId);

    Optional<Vehicle> findByRegistrationNumber(String registrationNumber);

    boolean existsByRegistrationNumber(String registrationNumber);

    List<Vehicle> findByVehicleTypeAndActiveTrueAndAvailableTrue(VehicleType vehicleType);

    @Query("SELECT v FROM Vehicle v " +
           "JOIN v.provider p " +
           "JOIN p.user u " +
           "WHERE v.vehicleType = :vehicleType " +
           "AND v.active = true " +
           "AND v.available = true " +
           "AND p.approved = true " +
           "AND u.enabled = true " +
           "AND LOWER(TRIM(p.city)) = LOWER(TRIM(:city))")
    List<Vehicle> findAvailableVehiclesInCity(@Param("vehicleType") VehicleType vehicleType,
                                             @Param("city") String city);
}
