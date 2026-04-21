package com.company.pms.dashboard;

import com.company.pms.milestone.MilestoneEntity;
import com.company.pms.milestone.MilestoneRepository;
import com.company.pms.project.ProjectEntity;
import com.company.pms.project.ProjectRepository;
import com.company.pms.risk.RiskEntity;
import com.company.pms.risk.RiskRepository;
import com.company.pms.wbs.WbsEntity;
import com.company.pms.wbs.WbsRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Month;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final ProjectRepository projectRepository;
    private final RiskRepository riskRepository;
    private final MilestoneRepository milestoneRepository;
    private final WbsRepository wbsRepository;

    public DashboardService(
        ProjectRepository projectRepository,
        RiskRepository riskRepository,
        MilestoneRepository milestoneRepository,
        WbsRepository wbsRepository
    ) {
        this.projectRepository = projectRepository;
        this.riskRepository = riskRepository;
        this.milestoneRepository = milestoneRepository;
        this.wbsRepository = wbsRepository;
    }

    public DashboardSummaryDto getSummary() {
        var projects = projectRepository.findAll();
        var milestones = milestoneRepository.findAll();
        var risks = riskRepository.findAll();
        var wbsNodes = wbsRepository.findAll();

        long activeProjects = projects.stream().filter(project -> "ACTIVE".equals(project.getStatus())).count();
        BigDecimal totalBudget = projects.stream()
            .map(project -> project.getBudgetAmount() == null ? BigDecimal.ZERO : project.getBudgetAmount())
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalActual = projects.stream()
            .map(project -> project.getActualAmount() == null ? BigDecimal.ZERO : project.getActualAmount())
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        double budgetVsActualPercent = totalBudget.signum() == 0
            ? 0.0
            : totalActual.multiply(BigDecimal.valueOf(100)).divide(totalBudget, 1, RoundingMode.HALF_UP).doubleValue();
        long delayedMilestones = milestones.stream()
            .filter(milestone -> milestone.getActualDate() == null && !"COMPLETED".equals(milestone.getStatus()))
            .filter(milestone -> milestone.getPlannedDate() != null && milestone.getPlannedDate().isBefore(java.time.LocalDate.now()))
            .count();
        long openCriticalRisks = risks.stream()
            .filter(risk -> !"CLOSED".equals(risk.getStatus()))
            .filter(risk -> risk.getSeverity() != null && risk.getSeverity() >= 15)
            .count();
        BigDecimal totalVariance = totalBudget.subtract(totalActual);

        Map<Long, BigDecimal> allocatedByProjectId = wbsNodes.stream()
            .collect(Collectors.groupingBy(
                WbsEntity::getProjectId,
                Collectors.reducing(
                    BigDecimal.ZERO,
                    wbs -> wbs.getBudgetAmount() == null ? BigDecimal.ZERO : wbs.getBudgetAmount(),
                    BigDecimal::add
                )
            ));

        List<DashboardSummaryDto.ProjectSummaryDto> projectSummaries = projects.stream()
            .sorted(Comparator
                .comparing((ProjectEntity project) -> !"ACTIVE".equals(project.getStatus()))
                .thenComparing(ProjectEntity::getEndDate, Comparator.nullsLast(Comparator.naturalOrder())))
            .limit(6)
            .map(project -> new DashboardSummaryDto.ProjectSummaryDto(
                String.valueOf(project.getId()),
                project.getProjectCode(),
                project.getProjectName(),
                project.getProjectManager(),
                project.getStatus(),
                project.getProgressPercent() == null ? 0 : project.getProgressPercent()
            ))
            .toList();

        List<DashboardSummaryDto.RiskSummaryDto> topRisks = risks.stream()
            .filter(risk -> !"CLOSED".equals(risk.getStatus()))
            .sorted(Comparator.comparing(RiskEntity::getSeverity, Comparator.nullsLast(Comparator.reverseOrder())))
            .limit(5)
            .map(risk -> new DashboardSummaryDto.RiskSummaryDto(
                String.valueOf(risk.getId()),
                risk.getTitle(),
                risk.getCategory(),
                risk.getOwner(),
                risk.getSeverity() == null ? 0 : risk.getSeverity()
            ))
            .toList();

        List<DashboardSummaryDto.CostSnapshotDto> costSnapshots = buildCostSnapshots(projects, allocatedByProjectId);

        Map<String, Long> milestoneStatusCounts = milestones.stream()
            .collect(Collectors.groupingBy(MilestoneEntity::getStatus, Collectors.counting()));

        List<DashboardSummaryDto.MilestoneStatusDto> milestonePulse = List.of(
            new DashboardSummaryDto.MilestoneStatusDto("Planned", milestoneStatusCounts.getOrDefault("PLANNED", 0L).intValue()),
            new DashboardSummaryDto.MilestoneStatusDto("In Progress", milestoneStatusCounts.getOrDefault("IN_PROGRESS", 0L).intValue()),
            new DashboardSummaryDto.MilestoneStatusDto("At Risk", milestoneStatusCounts.getOrDefault("AT_RISK", 0L).intValue()),
            new DashboardSummaryDto.MilestoneStatusDto("Completed", milestoneStatusCounts.getOrDefault("COMPLETED", 0L).intValue())
        );

        return new DashboardSummaryDto(
            Math.toIntExact(activeProjects),
            budgetVsActualPercent,
            Math.toIntExact(delayedMilestones),
            Math.toIntExact(openCriticalRisks),
            List.of(
                new DashboardSummaryDto.MetricDto("Active Projects", String.valueOf(activeProjects), projects.size() + " total in portfolio", "success"),
                new DashboardSummaryDto.MetricDto(
                    "Budget vs Actual",
                    budgetVsActualPercent + "%",
                    formatCurrency(totalVariance) + " remaining vs budget",
                    budgetVsActualPercent > 90 ? "warning" : "success"
                ),
                new DashboardSummaryDto.MetricDto(
                    "Delayed Milestones",
                    String.format("%02d", delayedMilestones),
                    milestonePulseTotal(milestonePulse) + " milestones tracked",
                    delayedMilestones > 0 ? "warning" : "success"
                ),
                new DashboardSummaryDto.MetricDto(
                    "Open Critical Risks",
                    String.format("%02d", openCriticalRisks),
                    risks.size() + " risks in register",
                    openCriticalRisks > 0 ? "danger" : "success"
                )
            ),
            projectSummaries,
            topRisks,
            costSnapshots,
            milestonePulse
        );
    }

    private List<DashboardSummaryDto.CostSnapshotDto> buildCostSnapshots(
        List<ProjectEntity> projects,
        Map<Long, BigDecimal> allocatedByProjectId
    ) {
        Map<Month, SnapshotAccumulator> monthlySnapshots = new LinkedHashMap<>();

        projects.stream()
            .filter(project -> project.getStartDate() != null)
            .sorted(Comparator.comparing(ProjectEntity::getStartDate))
            .forEach(project -> {
                Month month = project.getStartDate().getMonth();
                SnapshotAccumulator snapshot = monthlySnapshots.computeIfAbsent(month, ignored -> new SnapshotAccumulator());
                snapshot.budget = snapshot.budget.add(zeroIfNull(project.getBudgetAmount()));
                snapshot.actual = snapshot.actual.add(zeroIfNull(project.getActualAmount()));
                snapshot.allocated = snapshot.allocated.add(zeroIfNull(allocatedByProjectId.get(project.getId())));
            });

        List<DashboardSummaryDto.CostSnapshotDto> snapshots = new ArrayList<>(monthlySnapshots.size());
        monthlySnapshots.forEach((month, snapshot) -> snapshots.add(new DashboardSummaryDto.CostSnapshotDto(
            month.getDisplayName(TextStyle.SHORT, Locale.ENGLISH),
            toDouble(snapshot.budget),
            toDouble(snapshot.allocated),
            toDouble(snapshot.actual)
        )));

        return snapshots;
    }

    private int milestonePulseTotal(List<DashboardSummaryDto.MilestoneStatusDto> milestonePulse) {
        return milestonePulse.stream().mapToInt(DashboardSummaryDto.MilestoneStatusDto::value).sum();
    }

    private BigDecimal zeroIfNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private double toDouble(BigDecimal value) {
        return value == null ? 0.0 : value.setScale(2, RoundingMode.HALF_UP).doubleValue();
    }

    private String formatCurrency(BigDecimal value) {
        BigDecimal scaledValue = zeroIfNull(value).setScale(2, RoundingMode.HALF_UP);
        return scaledValue.stripTrailingZeros().toPlainString();
    }

    private static class SnapshotAccumulator {
        private BigDecimal budget = BigDecimal.ZERO;
        private BigDecimal allocated = BigDecimal.ZERO;
        private BigDecimal actual = BigDecimal.ZERO;
    }
}
