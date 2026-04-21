package com.company.pms.project;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectRepository extends JpaRepository<ProjectEntity, Long> {

    boolean existsByProjectCodeIgnoreCase(String projectCode);

    boolean existsByProjectCodeIgnoreCaseAndIdNot(String projectCode, Long id);
}
