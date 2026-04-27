package com.company.pms.project;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record ProjectWorkspaceRequest(
    @Valid @NotNull ProjectHeaderRequest project,
    @Valid List<WbsItemRequest> wbs,
    @Valid List<ActivityItemRequest> activities,
    @Valid List<MilestoneItemRequest> milestones
) {

    public record ProjectHeaderRequest(
        @NotBlank String projectCode,
        @NotBlank String projectName,
        @NotBlank String clientName,
        @NotBlank String projectManager,
        @NotNull LocalDate startDate,
        @NotNull LocalDate endDate,
        @NotNull BigDecimal budgetAmount
    ) {
    }

    public record WbsItemRequest(
        Long id,
        @NotBlank String clientKey,
        @NotBlank String wbsCode,
        @NotBlank String wbsName,
        @NotNull Integer levelNo,
        @NotNull Integer progressPercent,
        @NotNull BigDecimal budgetAmount,
        @NotNull BigDecimal actualAmount
    ) {
    }

    public record ActivityItemRequest(
        Long id,
        @NotBlank String clientKey,
        Long wbsId,
        String wbsClientKey,
        @NotBlank String activityCode,
        @NotBlank String activityName,
        @NotNull LocalDate plannedStart,
        @NotNull LocalDate plannedEnd,
        @NotNull Integer durationDays,
        @NotNull Integer progressPercent,
        @NotBlank String status,
        @NotBlank String responsibleUser
    ) {
    }

    public record MilestoneItemRequest(
        Long id,
        @NotBlank String clientKey,
        Long wbsId,
        String wbsClientKey,
        @NotBlank String milestoneCode,
        @NotBlank String milestoneName,
        @NotNull LocalDate plannedDate,
        LocalDate actualDate,
        @NotBlank String status
    ) {
    }
}
