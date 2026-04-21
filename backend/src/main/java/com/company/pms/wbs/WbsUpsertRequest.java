package com.company.pms.wbs;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record WbsUpsertRequest(
    @NotBlank String wbsCode,
    @NotBlank String wbsName,
    @NotNull @Min(1) Integer levelNo,
    @NotNull @Min(0) Integer progressPercent,
    @NotNull BigDecimal budgetAmount,
    @NotNull BigDecimal actualAmount
) {
}
