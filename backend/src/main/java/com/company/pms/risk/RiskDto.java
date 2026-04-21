package com.company.pms.risk;

import java.time.LocalDate;

public record RiskDto(
    Long id,
    Long projectId,
    Long activityId,
    String riskNo,
    String title,
    String category,
    String owner,
    Integer probability,
    Integer impact,
    Integer severity,
    String status,
    LocalDate targetDate
) {
}
