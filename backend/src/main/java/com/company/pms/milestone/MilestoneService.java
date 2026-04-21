package com.company.pms.milestone;

import com.company.pms.wbs.WbsEntity;
import com.company.pms.wbs.WbsRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class MilestoneService {

    private final MilestoneRepository milestoneRepository;
    private final WbsRepository wbsRepository;

    public MilestoneService(MilestoneRepository milestoneRepository, WbsRepository wbsRepository) {
        this.milestoneRepository = milestoneRepository;
        this.wbsRepository = wbsRepository;
    }

    public List<MilestoneDto> getMilestonesForProject(Long projectId) {
        return milestoneRepository.findByProjectIdOrderByPlannedDateAsc(projectId).stream()
            .map(this::toDto)
            .toList();
    }

    public MilestoneDto createMilestone(Long projectId, MilestoneUpsertRequest request) {
        if (milestoneRepository.existsByProjectIdAndMilestoneCodeIgnoreCase(projectId, request.milestoneCode())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Milestone code already exists for this project");
        }

        Long wbsId = validateWbs(projectId, request.wbsId());

        MilestoneEntity milestone = MilestoneEntity.builder()
            .projectId(projectId)
            .wbsId(wbsId)
            .milestoneCode(request.milestoneCode())
            .milestoneName(request.milestoneName())
            .plannedDate(request.plannedDate())
            .actualDate(request.actualDate())
            .status(request.status())
            .build();

        return toDto(milestoneRepository.save(milestone));
    }

    public MilestoneDto updateMilestone(Long projectId, Long id, MilestoneUpsertRequest request) {
        MilestoneEntity milestone = milestoneRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Milestone not found"));

        if (!milestone.getProjectId().equals(projectId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Milestone does not belong to the selected project");
        }

        if (milestoneRepository.existsByProjectIdAndMilestoneCodeIgnoreCaseAndIdNot(projectId, request.milestoneCode(), id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Milestone code already exists for this project");
        }

        Long wbsId = validateWbs(projectId, request.wbsId());

        milestone.setWbsId(wbsId);
        milestone.setMilestoneCode(request.milestoneCode());
        milestone.setMilestoneName(request.milestoneName());
        milestone.setPlannedDate(request.plannedDate());
        milestone.setActualDate(request.actualDate());
        milestone.setStatus(request.status());

        return toDto(milestoneRepository.save(milestone));
    }

    private Long validateWbs(Long projectId, Long wbsId) {
        if (wbsId == null) {
            return null;
        }

        WbsEntity wbs = wbsRepository.findById(wbsId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected WBS was not found"));

        if (!wbs.getProjectId().equals(projectId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected WBS does not belong to the selected project");
        }

        return wbsId;
    }

    private MilestoneDto toDto(MilestoneEntity milestone) {
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
