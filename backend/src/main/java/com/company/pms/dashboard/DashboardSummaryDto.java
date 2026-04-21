package com.company.pms.dashboard;

import java.util.List;

public record DashboardSummaryDto(
    int totalActiveProjects,
    double budgetVsActualPercent,
    int delayedMilestones,
    int openCriticalRisks,
    List<MetricDto> metrics,
    List<ProjectSummaryDto> projects,
    List<RiskSummaryDto> risks,
    List<CostSnapshotDto> costSnapshots,
    List<MilestoneStatusDto> milestonePulse
) {
    public record MetricDto(String label, String value, String change, String tone) {
    }

    public record ProjectSummaryDto(
        String id,
        String code,
        String name,
        String manager,
        String status,
        int progress
    ) {
    }

    public record RiskSummaryDto(
        String id,
        String title,
        String category,
        String owner,
        int severity
    ) {
    }

    public record CostSnapshotDto(
        String month,
        double budget,
        double allocated,
        double actual
    ) {
    }

    public record MilestoneStatusDto(
        String name,
        int value
    ) {
    }
}
