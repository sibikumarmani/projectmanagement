package com.company.pms.timesheet;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TimesheetEntryUpsertRequest(
    @NotNull Long userId,
    @NotNull Long projectId,
    @NotNull Long activityId,
    @NotNull LocalDate workDate,
    @NotNull @DecimalMin(value = "0.0", inclusive = true) BigDecimal regularHours,
    @NotNull @DecimalMin(value = "0.0", inclusive = true) BigDecimal overtimeHours,
    @NotNull Boolean allocatedActivity,
    @NotBlank String status,
    String remarks
) {
}
