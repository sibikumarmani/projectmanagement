package com.company.pms.allocation;

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
@RequestMapping("/api/employee-allocations")
public class EmployeeAllocationController {

    private final EmployeeAllocationService employeeAllocationService;

    public EmployeeAllocationController(EmployeeAllocationService employeeAllocationService) {
        this.employeeAllocationService = employeeAllocationService;
    }

    @GetMapping
    public ApiResponse<List<EmployeeAllocationDto>> getAllocations() {
        return ApiResponse.ok(employeeAllocationService.getAllocations());
    }

    @PostMapping
    public ApiResponse<EmployeeAllocationDto> createAllocation(@Valid @RequestBody EmployeeAllocationUpsertRequest request) {
        return ApiResponse.ok(employeeAllocationService.createAllocation(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<EmployeeAllocationDto> updateAllocation(@PathVariable Long id, @Valid @RequestBody EmployeeAllocationUpsertRequest request) {
        return ApiResponse.ok(employeeAllocationService.updateAllocation(id, request));
    }
}
