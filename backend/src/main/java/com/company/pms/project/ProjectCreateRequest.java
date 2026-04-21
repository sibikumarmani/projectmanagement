package com.company.pms.project;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ProjectCreateRequest(
    @NotBlank String projectCode,
    @NotBlank String projectName,
    @NotBlank String clientName,
    @NotBlank String projectManager,
    @NotNull LocalDate startDate,
    @NotNull LocalDate endDate,
    @NotNull BigDecimal budgetAmount
) {
}
