package com.taaskr.repository;

import com.taaskr.entity.ServiceCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
@Repository
public interface ServiceCategoryRepository extends JpaRepository<ServiceCategory, Long> {
    List<ServiceCategory> findByActiveTrueOrderByNameAsc();
    Optional<ServiceCategory> findByNameIgnoreCase(String name);
}
