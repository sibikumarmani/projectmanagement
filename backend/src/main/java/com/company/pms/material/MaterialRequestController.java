package com.company.pms.material;

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
@RequestMapping("/api/material-requests")
public class MaterialRequestController {

    private final MaterialRequestService materialRequestService;

    public MaterialRequestController(MaterialRequestService materialRequestService) {
        this.materialRequestService = materialRequestService;
    }

    @GetMapping
    public ApiResponse<List<MaterialRequestDto>> getMaterialRequests() {
        return ApiResponse.ok(materialRequestService.getMaterialRequests());
    }

    @PostMapping
    public ApiResponse<MaterialRequestDto> createMaterialRequest(@Valid @RequestBody MaterialRequestUpsertRequest request) {
        return ApiResponse.ok(materialRequestService.createMaterialRequest(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<MaterialRequestDto> updateMaterialRequest(@PathVariable Long id, @Valid @RequestBody MaterialRequestUpsertRequest request) {
        return ApiResponse.ok(materialRequestService.updateMaterialRequest(id, request));
    }
}
