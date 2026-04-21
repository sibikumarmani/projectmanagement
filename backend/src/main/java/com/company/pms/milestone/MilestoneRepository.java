package com.company.pms.milestone;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MilestoneRepository extends JpaRepository<MilestoneEntity, Long> {

    List<MilestoneEntity> findByProjectIdOrderByPlannedDateAsc(Long projectId);

    boolean existsByProjectIdAndMilestoneCodeIgnoreCase(Long projectId, String milestoneCode);

    boolean existsByProjectIdAndMilestoneCodeIgnoreCaseAndIdNot(Long projectId, String milestoneCode, Long id);
}
