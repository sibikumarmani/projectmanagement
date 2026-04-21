package com.company.pms.material;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record MaterialRequestUpsertRequest(
    @NotBlank String requestNo,
    @NotNull Long projectId,
    @NotNull Long activityId,
    @NotBlank String requestedBy,
    @NotBlank String status,
    @NotNull @DecimalMin(value = "0.0", inclusive = false) BigDecimal requestedQty,
    @NotNull @DecimalMin(value = "0.0", inclusive = true) BigDecimal approvedQty
) {
}
