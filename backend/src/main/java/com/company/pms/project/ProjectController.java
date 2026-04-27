package com.company.pms.project;

import com.company.pms.common.api.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping
    public ApiResponse<List<ProjectSummaryDto>> getProjects() {
        return ApiResponse.ok(projectService.getProjects());
    }

    @GetMapping("/{id}")
    public ApiResponse<ProjectSummaryDto> getProject(@PathVariable Long id) {
        return ApiResponse.ok(projectService.getProject(id));
    }

    @GetMapping("/{id}/workspace")
    public ApiResponse<ProjectWorkspaceDto> getProjectWorkspace(@PathVariable Long id) {
        return ApiResponse.ok(projectService.getProjectWorkspace(id));
    }

    @PostMapping
    public ApiResponse<ProjectSummaryDto> createProject(@Valid @RequestBody ProjectCreateRequest request) {
        return ApiResponse.ok(projectService.createProject(request));
    }

    @PostMapping("/workspace")
    public ApiResponse<ProjectWorkspaceDto> createProjectWorkspace(@Valid @RequestBody ProjectWorkspaceRequest request) {
        return ApiResponse.ok(projectService.createProjectWorkspace(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<ProjectSummaryDto> updateProject(@PathVariable Long id, @Valid @RequestBody ProjectCreateRequest request) {
        return ApiResponse.ok(projectService.updateProject(id, request));
    }

    @PutMapping("/{id}/workspace")
    public ApiResponse<ProjectWorkspaceDto> updateProjectWorkspace(
        @PathVariable Long id,
        @Valid @RequestBody ProjectWorkspaceRequest request
    ) {
        return ApiResponse.ok(projectService.updateProjectWorkspace(id, request));
    }

    @PutMapping("/{id}/deactivate")
    public ApiResponse<ProjectSummaryDto> deactivateProject(@PathVariable Long id) {
        return ApiResponse.ok(projectService.deactivateProject(id));
    }
}
