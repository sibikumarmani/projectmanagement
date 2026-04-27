package com.company.pms.wbs;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WbsRepository extends JpaRepository<WbsEntity, Long> {

    List<WbsEntity> findByProjectIdOrderByWbsCodeAsc(Long projectId);

    List<WbsEntity> findByProjectId(Long projectId);

    boolean existsByProjectIdAndWbsCodeIgnoreCase(Long projectId, String wbsCode);

    boolean existsByProjectIdAndWbsCodeIgnoreCaseAndIdNot(Long projectId, String wbsCode, Long id);
}
