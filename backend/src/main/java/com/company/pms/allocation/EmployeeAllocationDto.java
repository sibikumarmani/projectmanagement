package com.company.pms.allocation;

import java.time.LocalDate;

public record EmployeeAllocationDto(
    Long id,
    Long userId,
    String userCode,
    String employeeName,
    Long projectId,
    String projectCode,
    String projectName,
    Long activityId,
    String activityCode,
    String activityName,
    LocalDate allocationDate,
    Integer allocationPercentage,
    Boolean active,
    String remarks
) {
}
