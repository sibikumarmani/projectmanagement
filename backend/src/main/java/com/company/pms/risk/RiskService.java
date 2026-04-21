package com.company.pms.risk;

import com.company.pms.activity.ActivityEntity;
import com.company.pms.activity.ActivityRepository;
import com.company.pms.project.ProjectEntity;
import com.company.pms.project.ProjectRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class RiskService {

    private final RiskRepository riskRepository;
    private final ProjectRepository projectRepository;
    private final ActivityRepository activityRepository;

    public RiskService(
        RiskRepository riskRepository,
        ProjectRepository projectRepository,
        ActivityRepository activityRepository
    ) {
        this.riskRepository = riskRepository;
        this.projectRepository = projectRepository;
        this.activityRepository = activityRepository;
    }

    public List<RiskDto> getRisks() {
        return riskRepository.findAll().stream()
            .map(this::toDto)
            .toList();
    }

    public RiskDto createRisk(RiskUpsertRequest request) {
        if (riskRepository.existsByRiskNoIgnoreCase(request.riskNo())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Risk number already exists");
        }

        validateReferences(request.projectId(), request.activityId());

        RiskEntity risk = RiskEntity.builder()
            .projectId(request.projectId())
            .activityId(request.activityId())
            .riskNo(request.riskNo())
            .title(request.title())
            .category(request.category())
            .owner(request.owner())
            .probability(request.probability())
            .impact(request.impact())
            .severity(calculateSeverity(request.probability(), request.impact()))
            .status(request.status())
            .targetDate(request.targetDate())
            .build();

        return toDto(riskRepository.save(risk));
    }

    public RiskDto updateRisk(Long id, RiskUpsertRequest request) {
        RiskEntity risk = riskRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Risk not found"));

        if (riskRepository.existsByRiskNoIgnoreCaseAndIdNot(request.riskNo(), id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Risk number already exists");
        }

        validateReferences(request.projectId(), request.activityId());

        risk.setProjectId(request.projectId());
        risk.setActivityId(request.activityId());
        risk.setRiskNo(request.riskNo());
        risk.setTitle(request.title());
        risk.setCategory(request.category());
        risk.setOwner(request.owner());
        risk.setProbability(request.probability());
        risk.setImpact(request.impact());
        risk.setSeverity(calculateSeverity(request.probability(), request.impact()));
        risk.setStatus(request.status());
        risk.setTargetDate(request.targetDate());

        return toDto(riskRepository.save(risk));
    }

    private void validateReferences(Long projectId, Long activityId) {
        ProjectEntity project = projectRepository.findById(projectId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Project not found"));

        ActivityEntity activity = activityRepository.findById(activityId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Activity not found"));

        if (!activity.getProjectId().equals(project.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Activity does not belong to the selected project");
        }
    }

    private Integer calculateSeverity(Integer probability, Integer impact) {
        return probability * impact;
    }

    private RiskDto toDto(RiskEntity risk) {
        return new RiskDto(
            risk.getId(),
            risk.getProjectId(),
            risk.getActivityId(),
            risk.getRiskNo(),
            risk.getTitle(),
            risk.getCategory(),
            risk.getOwner(),
            risk.getProbability(),
            risk.getImpact(),
            risk.getSeverity(),
            risk.getStatus(),
            risk.getTargetDate()
        );
    }
}
