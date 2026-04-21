package com.company.pms.risk;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record RiskUpsertRequest(
    @NotNull Long projectId,
    @NotNull Long activityId,
    @NotBlank String riskNo,
    @NotBlank String title,
    @NotBlank String category,
    @NotBlank String owner,
    @NotNull @Min(1) @Max(5) Integer probability,
    @NotNull @Min(1) @Max(5) Integer impact,
    @NotBlank String status,
    @NotNull LocalDate targetDate
) {
}
