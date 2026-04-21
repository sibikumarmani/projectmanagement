package com.company.pms.activity;

import java.time.LocalDate;

public record ActivityDto(
    Long id,
    Long projectId,
    Long wbsId,
    String activityCode,
    String activityName,
    String wbsCode,
    LocalDate plannedStart,
    LocalDate plannedEnd,
    Integer durationDays,
    Integer progressPercent,
    String status,
    String responsibleUser
) {
}
