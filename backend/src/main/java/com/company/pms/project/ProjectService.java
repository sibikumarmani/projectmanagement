package com.company.pms.project;

import com.company.pms.activity.ActivityDto;
import com.company.pms.activity.ActivityEntity;
import com.company.pms.activity.ActivityRepository;
import com.company.pms.milestone.MilestoneDto;
import com.company.pms.milestone.MilestoneEntity;
import com.company.pms.milestone.MilestoneRepository;
import com.company.pms.wbs.WbsDto;
import com.company.pms.wbs.WbsEntity;
import com.company.pms.wbs.WbsRepository;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final WbsRepository wbsRepository;
    private final ActivityRepository activityRepository;
    private final MilestoneRepository milestoneRepository;

    public ProjectService(
        ProjectRepository projectRepository,
        WbsRepository wbsRepository,
        ActivityRepository activityRepository,
        MilestoneRepository milestoneRepository
    ) {
        this.projectRepository = projectRepository;
        this.wbsRepository = wbsRepository;
        this.activityRepository = activityRepository;
        this.milestoneRepository = milestoneRepository;
    }

    public List<ProjectSummaryDto> getProjects() {
        return projectRepository.findAll().stream()
            .map(this::toDto)
            .toList();
    }

    public ProjectSummaryDto getProject(Long id) {
        return projectRepository.findById(id)
            .map(this::toDto)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));
    }

    public ProjectWorkspaceDto getProjectWorkspace(Long id) {
        ProjectEntity project = projectRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));

        List<WbsEntity> wbsRows = wbsRepository.findByProjectIdOrderByWbsCodeAsc(id);
        Map<Long, String> wbsCodeById = wbsRows.stream()
            .collect(Collectors.toMap(WbsEntity::getId, WbsEntity::getWbsCode));

        return new ProjectWorkspaceDto(
            toDto(project),
            wbsRows.stream().map(this::toWbsDto).toList(),
            activityRepository.findByProjectIdOrderByActivityCodeAsc(id).stream()
                .map(activity -> toActivityDto(activity, wbsCodeById))
                .toList(),
            milestoneRepository.findByProjectIdOrderByPlannedDateAsc(id).stream()
                .map(this::toMilestoneDto)
                .toList()
        );
    }

    public ProjectSummaryDto createProject(ProjectCreateRequest request) {
        if (projectRepository.existsByProjectCodeIgnoreCase(request.projectCode())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Project code already exists");
        }

        ProjectEntity project = ProjectEntity.builder()
            .projectCode(request.projectCode())
            .projectName(request.projectName())
            .clientName(request.clientName())
            .projectManager(request.projectManager())
            .startDate(request.startDate())
            .endDate(request.endDate())
            .budgetAmount(request.budgetAmount())
            .actualAmount(BigDecimal.ZERO)
            .progressPercent(0)
            .status("PLANNING")
            .build();

        return toDto(projectRepository.save(project));
    }

    @Transactional
    public ProjectWorkspaceDto createProjectWorkspace(ProjectWorkspaceRequest request) {
        validateWorkspaceRequest(null, request);
        ProjectEntity project = buildNewProject(request.project());
        ProjectEntity savedProject = projectRepository.save(project);
        return saveWorkspaceChildren(savedProject, request);
    }

    public ProjectSummaryDto updateProject(Long id, ProjectCreateRequest request) {
        ProjectEntity project = projectRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));

        if (projectRepository.existsByProjectCodeIgnoreCaseAndIdNot(request.projectCode(), id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Project code already exists");
        }

        project.setProjectCode(request.projectCode());
        project.setProjectName(request.projectName());
        project.setClientName(request.clientName());
        project.setProjectManager(request.projectManager());
        project.setStartDate(request.startDate());
        project.setEndDate(request.endDate());
        project.setBudgetAmount(request.budgetAmount());

        return toDto(projectRepository.save(project));
    }

    @Transactional
    public ProjectWorkspaceDto updateProjectWorkspace(Long id, ProjectWorkspaceRequest request) {
        ProjectEntity project = projectRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));

        validateWorkspaceRequest(id, request);
        applyProjectHeader(project, request.project());
        ProjectEntity savedProject = projectRepository.save(project);
        return saveWorkspaceChildren(savedProject, request);
    }

    public ProjectSummaryDto deactivateProject(Long id) {
        ProjectEntity project = projectRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));

        project.setStatus("CLOSED");
        return toDto(projectRepository.save(project));
    }

    private ProjectSummaryDto toDto(ProjectEntity project) {
        return new ProjectSummaryDto(
            project.getId(),
            project.getProjectCode(),
            project.getProjectName(),
            project.getClientName(),
            project.getStatus(),
            project.getProjectManager(),
            project.getStartDate(),
            project.getEndDate(),
            project.getBudgetAmount(),
            project.getActualAmount(),
            project.getProgressPercent()
        );
    }

    private ProjectEntity buildNewProject(ProjectWorkspaceRequest.ProjectHeaderRequest request) {
        return ProjectEntity.builder()
            .projectCode(request.projectCode())
            .projectName(request.projectName())
            .clientName(request.clientName())
            .projectManager(request.projectManager())
            .startDate(request.startDate())
            .endDate(request.endDate())
            .budgetAmount(request.budgetAmount())
            .actualAmount(BigDecimal.ZERO)
            .progressPercent(0)
            .status("PLANNING")
            .build();
    }

    private void applyProjectHeader(ProjectEntity project, ProjectWorkspaceRequest.ProjectHeaderRequest request) {
        project.setProjectCode(request.projectCode());
        project.setProjectName(request.projectName());
        project.setClientName(request.clientName());
        project.setProjectManager(request.projectManager());
        project.setStartDate(request.startDate());
        project.setEndDate(request.endDate());
        project.setBudgetAmount(request.budgetAmount());
    }

    private ProjectWorkspaceDto saveWorkspaceChildren(ProjectEntity project, ProjectWorkspaceRequest request) {
        Long projectId = project.getId();
        Map<Long, WbsEntity> existingWbsById = wbsRepository.findByProjectId(projectId).stream()
            .collect(Collectors.toMap(WbsEntity::getId, Function.identity()));
        Map<Long, ActivityEntity> existingActivitiesById = activityRepository.findByProjectId(projectId).stream()
            .collect(Collectors.toMap(ActivityEntity::getId, Function.identity()));
        Map<Long, MilestoneEntity> existingMilestonesById = milestoneRepository.findByProjectId(projectId).stream()
            .collect(Collectors.toMap(MilestoneEntity::getId, Function.identity()));

        Map<String, WbsEntity> wbsByClientKey = new HashMap<>();
        List<WbsDto> savedWbs = new ArrayList<>();
        for (ProjectWorkspaceRequest.WbsItemRequest item : safeWbs(request.wbs())) {
            WbsEntity wbs = item.id() == null
                ? new WbsEntity()
                : existingWbsById.get(item.id());

            if (wbs == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "One or more WBS rows are invalid for this project");
            }

            boolean codeExists = item.id() == null
                ? wbsRepository.existsByProjectIdAndWbsCodeIgnoreCase(projectId, item.wbsCode())
                : wbsRepository.existsByProjectIdAndWbsCodeIgnoreCaseAndIdNot(projectId, item.wbsCode(), item.id());
            if (codeExists) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "WBS code already exists for this project");
            }

            wbs.setProjectId(projectId);
            wbs.setWbsCode(item.wbsCode());
            wbs.setWbsName(item.wbsName());
            wbs.setLevelNo(item.levelNo());
            wbs.setProgressPercent(item.progressPercent());
            wbs.setBudgetAmount(item.budgetAmount());
            wbs.setActualAmount(item.actualAmount());

            WbsEntity saved = wbsRepository.save(wbs);
            wbsByClientKey.put(item.clientKey(), saved);
            savedWbs.add(toWbsDto(saved));
        }

        Map<Long, String> wbsCodeById = savedWbs.stream()
            .collect(Collectors.toMap(WbsDto::id, WbsDto::wbsCode));

        List<ActivityDto> savedActivities = new ArrayList<>();
        for (ProjectWorkspaceRequest.ActivityItemRequest item : safeActivities(request.activities())) {
            ActivityEntity activity = item.id() == null
                ? new ActivityEntity()
                : existingActivitiesById.get(item.id());

            if (activity == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "One or more activity rows are invalid for this project");
            }

            boolean codeExists = item.id() == null
                ? activityRepository.existsByProjectIdAndActivityCodeIgnoreCase(projectId, item.activityCode())
                : activityRepository.existsByProjectIdAndActivityCodeIgnoreCaseAndIdNot(projectId, item.activityCode(), item.id());
            if (codeExists) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Activity code already exists for this project");
            }

            WbsEntity wbs = resolveWorkspaceWbs(projectId, item.wbsId(), item.wbsClientKey(), existingWbsById, wbsByClientKey);

            activity.setProjectId(projectId);
            activity.setWbsId(wbs.getId());
            activity.setActivityCode(item.activityCode());
            activity.setActivityName(item.activityName());
            activity.setPlannedStart(item.plannedStart());
            activity.setPlannedEnd(item.plannedEnd());
            activity.setDurationDays(item.durationDays());
            activity.setProgressPercent(item.progressPercent());
            activity.setStatus(item.status());
            activity.setResponsibleUser(item.responsibleUser());

            ActivityEntity saved = activityRepository.save(activity);
            savedActivities.add(toActivityDto(saved, wbsCodeById));
        }

        List<MilestoneDto> savedMilestones = new ArrayList<>();
        for (ProjectWorkspaceRequest.MilestoneItemRequest item : safeMilestones(request.milestones())) {
            MilestoneEntity milestone = item.id() == null
                ? new MilestoneEntity()
                : existingMilestonesById.get(item.id());

            if (milestone == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "One or more milestone rows are invalid for this project");
            }

            boolean codeExists = item.id() == null
                ? milestoneRepository.existsByProjectIdAndMilestoneCodeIgnoreCase(projectId, item.milestoneCode())
                : milestoneRepository.existsByProjectIdAndMilestoneCodeIgnoreCaseAndIdNot(projectId, item.milestoneCode(), item.id());
            if (codeExists) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Milestone code already exists for this project");
            }

            WbsEntity wbs = resolveOptionalWorkspaceWbs(projectId, item.wbsId(), item.wbsClientKey(), existingWbsById, wbsByClientKey);

            milestone.setProjectId(projectId);
            milestone.setWbsId(wbs == null ? null : wbs.getId());
            milestone.setMilestoneCode(item.milestoneCode());
            milestone.setMilestoneName(item.milestoneName());
            milestone.setPlannedDate(item.plannedDate());
            milestone.setActualDate(item.actualDate());
            milestone.setStatus(item.status());

            MilestoneEntity saved = milestoneRepository.save(milestone);
            savedMilestones.add(toMilestoneDto(saved));
        }

        return new ProjectWorkspaceDto(toDto(project), savedWbs, savedActivities, savedMilestones);
    }

    private void validateWorkspaceRequest(Long projectId, ProjectWorkspaceRequest request) {
        ProjectWorkspaceRequest.ProjectHeaderRequest header = request.project();
        if (header.endDate().isBefore(header.startDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End date must be on or after start date");
        }

        if (projectId == null) {
            if (projectRepository.existsByProjectCodeIgnoreCase(header.projectCode())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Project code already exists");
            }
        } else if (projectRepository.existsByProjectCodeIgnoreCaseAndIdNot(header.projectCode(), projectId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Project code already exists");
        }

        validateUniqueClientKeys(request);
        validateUniqueCodes("WBS", safeWbs(request.wbs()).stream().map(ProjectWorkspaceRequest.WbsItemRequest::wbsCode).toList());
        validateUniqueCodes("Activity", safeActivities(request.activities()).stream().map(ProjectWorkspaceRequest.ActivityItemRequest::activityCode).toList());
        validateUniqueCodes("Milestone", safeMilestones(request.milestones()).stream().map(ProjectWorkspaceRequest.MilestoneItemRequest::milestoneCode).toList());
    }

    private void validateUniqueClientKeys(ProjectWorkspaceRequest request) {
        validateUniqueCodes("WBS row key", safeWbs(request.wbs()).stream().map(ProjectWorkspaceRequest.WbsItemRequest::clientKey).toList());
        validateUniqueCodes("Activity row key", safeActivities(request.activities()).stream().map(ProjectWorkspaceRequest.ActivityItemRequest::clientKey).toList());
        validateUniqueCodes("Milestone row key", safeMilestones(request.milestones()).stream().map(ProjectWorkspaceRequest.MilestoneItemRequest::clientKey).toList());
    }

    private void validateUniqueCodes(String label, List<String> values) {
        Set<String> seen = new HashSet<>();
        for (String value : values) {
            String normalized = value.trim().toLowerCase(Locale.ROOT);
            if (!seen.add(normalized)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " contains duplicate values");
            }
        }
    }

    private WbsEntity resolveWorkspaceWbs(
        Long projectId,
        Long wbsId,
        String wbsClientKey,
        Map<Long, WbsEntity> existingWbsById,
        Map<String, WbsEntity> newWbsByClientKey
    ) {
        WbsEntity resolved = resolveOptionalWorkspaceWbs(projectId, wbsId, wbsClientKey, existingWbsById, newWbsByClientKey);
        if (resolved == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Each activity must reference a valid WBS row");
        }
        return resolved;
    }

    private WbsEntity resolveOptionalWorkspaceWbs(
        Long projectId,
        Long wbsId,
        String wbsClientKey,
        Map<Long, WbsEntity> existingWbsById,
        Map<String, WbsEntity> newWbsByClientKey
    ) {
        if (wbsId != null) {
            WbsEntity wbs = existingWbsById.get(wbsId);
            if (wbs == null || !wbs.getProjectId().equals(projectId)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "One or more WBS references are invalid");
            }
            return wbs;
        }

        if (wbsClientKey == null || wbsClientKey.isBlank()) {
            return null;
        }

        WbsEntity wbs = newWbsByClientKey.get(wbsClientKey);
        if (wbs == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "One or more WBS references are missing from the save request");
        }
        return wbs;
    }

    private List<ProjectWorkspaceRequest.WbsItemRequest> safeWbs(List<ProjectWorkspaceRequest.WbsItemRequest> values) {
        return values == null ? List.of() : values;
    }

    private List<ProjectWorkspaceRequest.ActivityItemRequest> safeActivities(List<ProjectWorkspaceRequest.ActivityItemRequest> values) {
        return values == null ? List.of() : values;
    }

    private List<ProjectWorkspaceRequest.MilestoneItemRequest> safeMilestones(List<ProjectWorkspaceRequest.MilestoneItemRequest> values) {
        return values == null ? List.of() : values;
    }

    private WbsDto toWbsDto(WbsEntity wbs) {
        return new WbsDto(
            wbs.getId(),
            wbs.getProjectId(),
            wbs.getWbsCode(),
            wbs.getWbsName(),
            wbs.getLevelNo(),
            wbs.getProgressPercent(),
            wbs.getBudgetAmount(),
            wbs.getActualAmount()
        );
    }

    private ActivityDto toActivityDto(ActivityEntity activity, Map<Long, String> wbsCodeById) {
        return new ActivityDto(
            activity.getId(),
            activity.getProjectId(),
            activity.getWbsId(),
            activity.getActivityCode(),
            activity.getActivityName(),
            wbsCodeById.get(activity.getWbsId()),
            activity.getPlannedStart(),
            activity.getPlannedEnd(),
            activity.getDurationDays(),
            activity.getProgressPercent(),
            activity.getStatus(),
            activity.getResponsibleUser()
        );
    }

    private MilestoneDto toMilestoneDto(MilestoneEntity milestone) {
        return new MilestoneDto(
            milestone.getId(),
            milestone.getProjectId(),
            milestone.getWbsId(),
            milestone.getMilestoneCode(),
            milestone.getMilestoneName(),
            milestone.getPlannedDate(),
            milestone.getActualDate(),
            milestone.getStatus()
        );
    }
}
