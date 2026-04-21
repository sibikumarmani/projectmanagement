package com.company.pms.material;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MaterialRequestRepository extends JpaRepository<MaterialRequestEntity, Long> {

    List<MaterialRequestEntity> findAllByOrderByRequestNoAsc();

    boolean existsByRequestNoIgnoreCase(String requestNo);

    boolean existsByRequestNoIgnoreCaseAndIdNot(String requestNo, Long id);
}
