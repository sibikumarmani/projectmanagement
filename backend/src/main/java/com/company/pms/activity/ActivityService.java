package com.company.pms.activity;

import com.company.pms.wbs.WbsEntity;
import com.company.pms.wbs.WbsRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ActivityService {

    private final ActivityRepository activityRepository;
    private final WbsRepository wbsRepository;

    public ActivityService(ActivityRepository activityRepository, WbsRepository wbsRepository) {
        this.activityRepository = activityRepository;
        this.wbsRepository = wbsRepository;
    }

    public List<ActivityDto> getActivitiesForProject(Long projectId) {
        List<ActivityEntity> activities = activityRepository.findByProjectIdOrderByActivityCodeAsc(projectId);
        Map<Long, String> wbsCodeById = wbsRepository.findByProjectIdOrderByWbsCodeAsc(projectId).stream()
            .collect(Collectors.toMap(WbsEntity::getId, WbsEntity::getWbsCode));

        return activities.stream()
            .map(activity -> toDto(activity, wbsCodeById))
            .toList();
    }

    public ActivityDto createActivity(Long projectId, ActivityUpsertRequest request) {
        if (activityRepository.existsByProjectIdAndActivityCodeIgnoreCase(projectId, request.activityCode())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Activity code already exists for this project");
        }

        WbsEntity wbs = validateWbs(projectId, request.wbsId());
        ActivityEntity activity = ActivityEntity.builder()
            .projectId(projectId)
            .wbsId(wbs.getId())
            .activityCode(request.activityCode())
            .activityName(request.activityName())
            .plannedStart(request.plannedStart())
            .plannedEnd(request.plannedEnd())
            .durationDays(request.durationDays())
            .progressPercent(request.progressPercent())
            .status(request.status())
            .responsibleUser(request.responsibleUser())
            .build();

        return toDto(activityRepository.save(activity), Map.of(wbs.getId(), wbs.getWbsCode()));
    }

    public ActivityDto updateActivity(Long projectId, Long id, ActivityUpsertRequest request) {
        ActivityEntity activity = activityRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Activity not found"));

        if (!activity.getProjectId().equals(projectId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Activity does not belong to the selected project");
        }

        if (activityRepository.existsByProjectIdAndActivityCodeIgnoreCaseAndIdNot(projectId, request.activityCode(), id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Activity code already exists for this project");
        }

        WbsEntity wbs = validateWbs(projectId, request.wbsId());
        activity.setWbsId(wbs.getId());
        activity.setActivityCode(request.activityCode());
        activity.setActivityName(request.activityName());
        activity.setPlannedStart(request.plannedStart());
        activity.setPlannedEnd(request.plannedEnd());
        activity.setDurationDays(request.durationDays());
        activity.setProgressPercent(request.progressPercent());
        activity.setStatus(request.status());
        activity.setResponsibleUser(request.responsibleUser());

        return toDto(activityRepository.save(activity), Map.of(wbs.getId(), wbs.getWbsCode()));
    }

    private WbsEntity validateWbs(Long projectId, Long wbsId) {
        WbsEntity wbs = wbsRepository.findById(wbsId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected WBS was not found"));

        if (!wbs.getProjectId().equals(projectId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected WBS does not belong to the selected project");
        }

        return wbs;
    }

    private ActivityDto toDto(ActivityEntity activity, Map<Long, String> wbsCodeById) {
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
}
