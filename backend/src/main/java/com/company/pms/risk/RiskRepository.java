package com.company.pms.risk;

import org.springframework.data.jpa.repository.JpaRepository;

public interface RiskRepository extends JpaRepository<RiskEntity, Long> {

    long countBySeverityGreaterThanEqual(Integer severity);

    boolean existsByRiskNoIgnoreCase(String riskNo);

    boolean existsByRiskNoIgnoreCaseAndIdNot(String riskNo, Long id);
}
