package com.company.pms.risk;

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
@RequestMapping("/api/risks")
public class RiskController {

    private final RiskService riskService;

    public RiskController(RiskService riskService) {
        this.riskService = riskService;
    }

    @GetMapping
    public ApiResponse<List<RiskDto>> getRisks() {
        return ApiResponse.ok(riskService.getRisks());
    }

    @PostMapping
    public ApiResponse<RiskDto> createRisk(@Valid @RequestBody RiskUpsertRequest request) {
        return ApiResponse.ok(riskService.createRisk(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<RiskDto> updateRisk(@PathVariable Long id, @Valid @RequestBody RiskUpsertRequest request) {
        return ApiResponse.ok(riskService.updateRisk(id, request));
    }
}
