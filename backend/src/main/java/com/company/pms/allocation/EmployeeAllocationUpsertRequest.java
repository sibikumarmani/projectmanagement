package com.company.pms.allocation;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record EmployeeAllocationUpsertRequest(
    @NotNull Long userId,
    @NotNull Long projectId,
    @NotNull Long activityId,
    @NotNull LocalDate allocationDate,
    @NotNull @Min(1) @Max(100) Integer allocationPercentage,
    @NotNull Boolean active,
    String remarks
) {
}
