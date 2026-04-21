package com.company.pms.billing;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record BillingUpsertRequest(
    @NotNull Long milestoneId,
    @NotBlank String billingNo,
    @NotNull LocalDate billingDate,
    @NotNull @DecimalMin(value = "0.0", inclusive = false) BigDecimal billedAmount,
    @NotNull @DecimalMin(value = "0.0", inclusive = true) BigDecimal certifiedAmount,
    @NotBlank String status,
    String remarks
) {
}
