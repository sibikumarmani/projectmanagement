package com.company.pms.activity;

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
@RequestMapping("/api/projects/{projectId}/activities")
public class ActivityController {

    private final ActivityService activityService;

    public ActivityController(ActivityService activityService) {
        this.activityService = activityService;
    }

    @GetMapping
    public ApiResponse<List<ActivityDto>> getActivities(@PathVariable Long projectId) {
        return ApiResponse.ok(activityService.getActivitiesForProject(projectId));
    }

    @PostMapping
    public ApiResponse<ActivityDto> createActivity(@PathVariable Long projectId, @Valid @RequestBody ActivityUpsertRequest request) {
        return ApiResponse.ok(activityService.createActivity(projectId, request));
    }

    @PutMapping("/{id}")
    public ApiResponse<ActivityDto> updateActivity(
        @PathVariable Long projectId,
        @PathVariable Long id,
        @Valid @RequestBody ActivityUpsertRequest request
    ) {
        return ApiResponse.ok(activityService.updateActivity(projectId, id, request));
    }
}
