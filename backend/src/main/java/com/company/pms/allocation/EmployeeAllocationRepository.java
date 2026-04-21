package com.company.pms.allocation;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EmployeeAllocationRepository extends JpaRepository<EmployeeAllocationEntity, Long> {

    List<EmployeeAllocationEntity> findAllByOrderByAllocationDateDescIdDesc();

    List<EmployeeAllocationEntity> findAllByUserIdAndProjectIdAndActiveTrue(Long userId, Long projectId);

    boolean existsByUserIdAndActivityIdAndActiveTrue(Long userId, Long activityId);
}
