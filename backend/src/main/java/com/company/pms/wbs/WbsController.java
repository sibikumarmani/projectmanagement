package com.company.pms.wbs;

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
@RequestMapping("/api/projects/{projectId}/wbs")
public class WbsController {

    private final WbsService wbsService;

    public WbsController(WbsService wbsService) {
        this.wbsService = wbsService;
    }

    @GetMapping
    public ApiResponse<List<WbsDto>> getWbs(@PathVariable Long projectId) {
        return ApiResponse.ok(wbsService.getWbsForProject(projectId));
    }

    @PostMapping
    public ApiResponse<WbsDto> createWbs(@PathVariable Long projectId, @Valid @RequestBody WbsUpsertRequest request) {
        return ApiResponse.ok(wbsService.createWbs(projectId, request));
    }

    @PutMapping("/{id}")
    public ApiResponse<WbsDto> updateWbs(
        @PathVariable Long projectId,
        @PathVariable Long id,
        @Valid @RequestBody WbsUpsertRequest request
    ) {
        return ApiResponse.ok(wbsService.updateWbs(projectId, id, request));
    }
}
