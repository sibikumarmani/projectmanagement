package com.company.pms.timesheet;

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
@RequestMapping("/api/timesheets")
public class TimesheetEntryController {

    private final TimesheetEntryService timesheetEntryService;

    public TimesheetEntryController(TimesheetEntryService timesheetEntryService) {
        this.timesheetEntryService = timesheetEntryService;
    }

    @GetMapping
    public ApiResponse<List<TimesheetEntryDto>> getTimesheets() {
        return ApiResponse.ok(timesheetEntryService.getTimesheets());
    }

    @PostMapping
    public ApiResponse<TimesheetEntryDto> createTimesheet(@Valid @RequestBody TimesheetEntryUpsertRequest request) {
        return ApiResponse.ok(timesheetEntryService.createTimesheet(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<TimesheetEntryDto> updateTimesheet(@PathVariable Long id, @Valid @RequestBody TimesheetEntryUpsertRequest request) {
        return ApiResponse.ok(timesheetEntryService.updateTimesheet(id, request));
    }
}
