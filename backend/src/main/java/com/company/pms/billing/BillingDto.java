package com.company.pms.billing;

import java.math.BigDecimal;
import java.time.LocalDate;

public record BillingDto(
    Long id,
    Long projectId,
    Long milestoneId,
    String milestoneCode,
    String milestoneName,
    String billingNo,
    LocalDate billingDate,
    BigDecimal billedAmount,
    BigDecimal certifiedAmount,
    String status,
    String remarks
) {
}
