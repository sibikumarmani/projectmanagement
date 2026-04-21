package com.company.pms.project;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;

    public ProjectService(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
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
}
