package com.company.pms.timesheet;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TimesheetEntryDto(
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
    LocalDate workDate,
    BigDecimal regularHours,
    BigDecimal overtimeHours,
    Boolean allocatedActivity,
    String status,
    String remarks
) {
}
