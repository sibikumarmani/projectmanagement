package com.company.pms.wbs;

import java.math.BigDecimal;

public record WbsDto(
    Long id,
    Long projectId,
    String wbsCode,
    String wbsName,
    Integer levelNo,
    Integer progressPercent,
    BigDecimal budgetAmount,
    BigDecimal actualAmount
) {
}
