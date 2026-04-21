package com.company.pms.billing;

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
@RequestMapping("/api/projects/{projectId}/billings")
public class BillingController {

    private final BillingService billingService;

    public BillingController(BillingService billingService) {
        this.billingService = billingService;
    }

    @GetMapping
    public ApiResponse<List<BillingDto>> getBillings(@PathVariable Long projectId) {
        return ApiResponse.ok(billingService.getBillingsForProject(projectId));
    }

    @PostMapping
    public ApiResponse<BillingDto> createBilling(@PathVariable Long projectId, @Valid @RequestBody BillingUpsertRequest request) {
        return ApiResponse.ok(billingService.createBilling(projectId, request));
    }

    @PutMapping("/{id}")
    public ApiResponse<BillingDto> updateBilling(
        @PathVariable Long projectId,
        @PathVariable Long id,
        @Valid @RequestBody BillingUpsertRequest request
    ) {
        return ApiResponse.ok(billingService.updateBilling(projectId, id, request));
    }
}
