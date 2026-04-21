package com.company.pms.milestone;

import java.time.LocalDate;

public record MilestoneDto(
    Long id,
    Long projectId,
    Long wbsId,
    String milestoneCode,
    String milestoneName,
    LocalDate plannedDate,
    LocalDate actualDate,
    String status
) {
}
