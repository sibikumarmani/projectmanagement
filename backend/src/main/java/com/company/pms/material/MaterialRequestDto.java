package com.company.pms.material;

import java.math.BigDecimal;

public record MaterialRequestDto(
    Long id,
    String requestNo,
    Long projectId,
    String project,
    Long activityId,
    String activity,
    String requestedBy,
    String status,
    BigDecimal requestedQty,
    BigDecimal approvedQty,
    BigDecimal pendingQty
) {
}
