package com.company.pms.billing;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BillingRepository extends JpaRepository<BillingEntity, Long> {

    List<BillingEntity> findByProjectIdOrderByBillingDateDesc(Long projectId);

    boolean existsByBillingNoIgnoreCase(String billingNo);

    boolean existsByBillingNoIgnoreCaseAndIdNot(String billingNo, Long id);
}
