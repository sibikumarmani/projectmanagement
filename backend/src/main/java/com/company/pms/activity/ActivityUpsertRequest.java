package com.company.pms.activity;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record ActivityUpsertRequest(
    @NotBlank String activityCode,
    @NotBlank String activityName,
    @NotNull Long wbsId,
    @NotNull LocalDate plannedStart,
    @NotNull LocalDate plannedEnd,
    @NotNull @Min(1) Integer durationDays,
    @NotNull @Min(0) @Max(100) Integer progressPercent,
    @NotBlank String status,
    @NotBlank String responsibleUser
) {
}
