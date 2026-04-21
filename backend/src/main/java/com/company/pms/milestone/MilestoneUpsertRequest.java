package com.company.pms.milestone;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record MilestoneUpsertRequest(
    @NotBlank String milestoneCode,
    @NotBlank String milestoneName,
    Long wbsId,
    @NotNull LocalDate plannedDate,
    LocalDate actualDate,
    @NotBlank String status
) {
}
