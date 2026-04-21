package com.company.pms.milestone;

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
@RequestMapping("/api/projects/{projectId}/milestones")
public class MilestoneController {

    private final MilestoneService milestoneService;

    public MilestoneController(MilestoneService milestoneService) {
        this.milestoneService = milestoneService;
    }

    @GetMapping
    public ApiResponse<List<MilestoneDto>> getMilestones(@PathVariable Long projectId) {
        return ApiResponse.ok(milestoneService.getMilestonesForProject(projectId));
    }

    @PostMapping
    public ApiResponse<MilestoneDto> createMilestone(@PathVariable Long projectId, @Valid @RequestBody MilestoneUpsertRequest request) {
        return ApiResponse.ok(milestoneService.createMilestone(projectId, request));
    }

    @PutMapping("/{id}")
    public ApiResponse<MilestoneDto> updateMilestone(
        @PathVariable Long projectId,
        @PathVariable Long id,
        @Valid @RequestBody MilestoneUpsertRequest request
    ) {
        return ApiResponse.ok(milestoneService.updateMilestone(projectId, id, request));
    }
}
