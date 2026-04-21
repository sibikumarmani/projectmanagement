package com.company.pms.project;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ProjectSummaryDto(
    Long id,
    String projectCode,
    String projectName,
    String clientName,
    String status,
    String projectManager,
    LocalDate startDate,
    LocalDate endDate,
    BigDecimal budgetAmount,
    BigDecimal actualAmount,
    Integer progressPercent
) {
}
