package com.company.pms.activity;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ActivityRepository extends JpaRepository<ActivityEntity, Long> {

    List<ActivityEntity> findByProjectIdOrderByActivityCodeAsc(Long projectId);

    List<ActivityEntity> findByProjectId(Long projectId);

    boolean existsByProjectIdAndActivityCodeIgnoreCase(Long projectId, String activityCode);

    boolean existsByProjectIdAndActivityCodeIgnoreCaseAndIdNot(Long projectId, String activityCode, Long id);
}
