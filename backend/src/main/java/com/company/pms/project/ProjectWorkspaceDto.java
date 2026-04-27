package com.company.pms.project;

import com.company.pms.activity.ActivityDto;
import com.company.pms.milestone.MilestoneDto;
import com.company.pms.wbs.WbsDto;

import java.util.List;

public record ProjectWorkspaceDto(
    ProjectSummaryDto project,
    List<WbsDto> wbs,
    List<ActivityDto> activities,
    List<MilestoneDto> milestones
) {
}
