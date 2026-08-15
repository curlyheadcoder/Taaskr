package com.taaskr.repository;

import com.taaskr.entity.Service;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
@Repository
public interface ServiceRepository extends JpaRepository<Service, Long> {
    List<Service> findByActiveTrueOrderByNameAsc();
    List<Service> findByCategoryIdAndActiveTrueOrderByNameAsc(Long categoryId);
}
