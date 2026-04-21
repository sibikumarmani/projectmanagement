package com.company.pms.wbs;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class WbsService {

    private final WbsRepository wbsRepository;

    public WbsService(WbsRepository wbsRepository) {
        this.wbsRepository = wbsRepository;
    }

    public List<WbsDto> getWbsForProject(Long projectId) {
        return wbsRepository.findByProjectIdOrderByWbsCodeAsc(projectId).stream()
            .map(this::toDto)
            .toList();
    }

    public WbsDto createWbs(Long projectId, WbsUpsertRequest request) {
        if (wbsRepository.existsByProjectIdAndWbsCodeIgnoreCase(projectId, request.wbsCode())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "WBS code already exists for this project");
        }

        WbsEntity wbs = WbsEntity.builder()
            .projectId(projectId)
            .wbsCode(request.wbsCode())
            .wbsName(request.wbsName())
            .levelNo(request.levelNo())
            .progressPercent(request.progressPercent())
            .budgetAmount(request.budgetAmount())
            .actualAmount(request.actualAmount())
            .build();

        return toDto(wbsRepository.save(wbs));
    }

    public WbsDto updateWbs(Long projectId, Long id, WbsUpsertRequest request) {
        WbsEntity wbs = wbsRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "WBS not found"));

        if (!wbs.getProjectId().equals(projectId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "WBS does not belong to the selected project");
        }

        if (wbsRepository.existsByProjectIdAndWbsCodeIgnoreCaseAndIdNot(projectId, request.wbsCode(), id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "WBS code already exists for this project");
        }

        wbs.setWbsCode(request.wbsCode());
        wbs.setWbsName(request.wbsName());
        wbs.setLevelNo(request.levelNo());
        wbs.setProgressPercent(request.progressPercent());
        wbs.setBudgetAmount(request.budgetAmount());
        wbs.setActualAmount(request.actualAmount());

        return toDto(wbsRepository.save(wbs));
    }

    private WbsDto toDto(WbsEntity wbs) {
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
}
