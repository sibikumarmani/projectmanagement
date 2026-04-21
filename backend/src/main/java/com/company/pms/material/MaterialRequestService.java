package com.company.pms.material;

import com.company.pms.activity.ActivityEntity;
import com.company.pms.activity.ActivityRepository;
import com.company.pms.project.ProjectEntity;
import com.company.pms.project.ProjectRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@Service
public class MaterialRequestService {

    private final MaterialRequestRepository materialRequestRepository;
    private final ProjectRepository projectRepository;
    private final ActivityRepository activityRepository;

    public MaterialRequestService(
        MaterialRequestRepository materialRequestRepository,
        ProjectRepository projectRepository,
        ActivityRepository activityRepository
    ) {
        this.materialRequestRepository = materialRequestRepository;
        this.projectRepository = projectRepository;
        this.activityRepository = activityRepository;
    }

    public List<MaterialRequestDto> getMaterialRequests() {
        return materialRequestRepository.findAllByOrderByRequestNoAsc().stream()
            .map(this::toDto)
            .toList();
    }

    public MaterialRequestDto createMaterialRequest(MaterialRequestUpsertRequest request) {
        if (materialRequestRepository.existsByRequestNoIgnoreCase(request.requestNo())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Request number already exists");
        }

        ValidationContext context = validateReferences(request.projectId(), request.activityId(), request.approvedQty(), request.requestedQty());

        MaterialRequestEntity materialRequest = MaterialRequestEntity.builder()
            .requestNo(request.requestNo())
            .projectId(request.projectId())
            .activityId(request.activityId())
            .requestedBy(request.requestedBy())
            .status(request.status())
            .requestedQty(request.requestedQty())
            .approvedQty(request.approvedQty())
            .build();

        return toDto(materialRequestRepository.save(materialRequest), context.project, context.activity);
    }

    public MaterialRequestDto updateMaterialRequest(Long id, MaterialRequestUpsertRequest request) {
        MaterialRequestEntity materialRequest = materialRequestRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Material request not found"));

        if (materialRequestRepository.existsByRequestNoIgnoreCaseAndIdNot(request.requestNo(), id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Request number already exists");
        }

        ValidationContext context = validateReferences(request.projectId(), request.activityId(), request.approvedQty(), request.requestedQty());

        materialRequest.setRequestNo(request.requestNo());
        materialRequest.setProjectId(request.projectId());
        materialRequest.setActivityId(request.activityId());
        materialRequest.setRequestedBy(request.requestedBy());
        materialRequest.setStatus(request.status());
        materialRequest.setRequestedQty(request.requestedQty());
        materialRequest.setApprovedQty(request.approvedQty());

        return toDto(materialRequestRepository.save(materialRequest), context.project, context.activity);
    }

    private ValidationContext validateReferences(Long projectId, Long activityId, BigDecimal approvedQty, BigDecimal requestedQty) {
        ProjectEntity project = projectRepository.findById(projectId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Project not found"));

        ActivityEntity activity = activityRepository.findById(activityId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Activity not found"));

        if (!activity.getProjectId().equals(projectId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Activity does not belong to the selected project");
        }

        if (approvedQty.compareTo(requestedQty) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Approved quantity cannot exceed requested quantity");
        }

        return new ValidationContext(project, activity);
    }

    private MaterialRequestDto toDto(MaterialRequestEntity entity) {
        ProjectEntity project = projectRepository.findById(entity.getProjectId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Project not found"));
        ActivityEntity activity = activityRepository.findById(entity.getActivityId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Activity not found"));
        return toDto(entity, project, activity);
    }

    private MaterialRequestDto toDto(MaterialRequestEntity entity, ProjectEntity project, ActivityEntity activity) {
        BigDecimal pendingQty = entity.getRequestedQty().subtract(entity.getApprovedQty());
        return new MaterialRequestDto(
            entity.getId(),
            entity.getRequestNo(),
            entity.getProjectId(),
            project.getProjectName(),
            entity.getActivityId(),
            activity.getActivityName(),
            entity.getRequestedBy(),
            entity.getStatus(),
            entity.getRequestedQty(),
            entity.getApprovedQty(),
            pendingQty.max(BigDecimal.ZERO)
        );
    }

    private record ValidationContext(ProjectEntity project, ActivityEntity activity) {
    }
}
