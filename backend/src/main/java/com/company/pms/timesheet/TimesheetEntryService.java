package com.company.pms.timesheet;

import com.company.pms.activity.ActivityEntity;
import com.company.pms.activity.ActivityRepository;
import com.company.pms.allocation.EmployeeAllocationRepository;
import com.company.pms.auth.UserEntity;
import com.company.pms.auth.UserRepository;
import com.company.pms.project.ProjectEntity;
import com.company.pms.project.ProjectRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@Service
public class TimesheetEntryService {

    private final TimesheetEntryRepository timesheetEntryRepository;
    private final EmployeeAllocationRepository employeeAllocationRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final ActivityRepository activityRepository;

    public TimesheetEntryService(
        TimesheetEntryRepository timesheetEntryRepository,
        EmployeeAllocationRepository employeeAllocationRepository,
        UserRepository userRepository,
        ProjectRepository projectRepository,
        ActivityRepository activityRepository
    ) {
        this.timesheetEntryRepository = timesheetEntryRepository;
        this.employeeAllocationRepository = employeeAllocationRepository;
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.activityRepository = activityRepository;
    }

    @Transactional(readOnly = true)
    public List<TimesheetEntryDto> getTimesheets() {
        return timesheetEntryRepository.findAllByOrderByWorkDateDescIdDesc().stream()
            .map(this::toDto)
            .toList();
    }

    @Transactional
    public TimesheetEntryDto createTimesheet(TimesheetEntryUpsertRequest request) {
        ActivityEntity activity = validateRequest(request);

        TimesheetEntryEntity entry = timesheetEntryRepository.save(
            TimesheetEntryEntity.builder()
                .userId(request.userId())
                .projectId(request.projectId())
                .activityId(activity.getId())
                .workDate(request.workDate())
                .regularHours(request.regularHours())
                .overtimeHours(request.overtimeHours())
                .allocatedActivity(request.allocatedActivity())
                .status(request.status().trim().toUpperCase())
                .remarks(normalizeRemarks(request.remarks()))
                .build()
        );

        return toDto(entry);
    }

    @Transactional
    public TimesheetEntryDto updateTimesheet(Long id, TimesheetEntryUpsertRequest request) {
        TimesheetEntryEntity entry = timesheetEntryRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Timesheet entry not found"));

        ActivityEntity activity = validateRequest(request);

        entry.setUserId(request.userId());
        entry.setProjectId(request.projectId());
        entry.setActivityId(activity.getId());
        entry.setWorkDate(request.workDate());
        entry.setRegularHours(request.regularHours());
        entry.setOvertimeHours(request.overtimeHours());
        entry.setAllocatedActivity(request.allocatedActivity());
        entry.setStatus(request.status().trim().toUpperCase());
        entry.setRemarks(normalizeRemarks(request.remarks()));

        return toDto(timesheetEntryRepository.save(entry));
    }

    private ActivityEntity validateRequest(TimesheetEntryUpsertRequest request) {
        if (request.regularHours().compareTo(BigDecimal.ZERO) == 0 && request.overtimeHours().compareTo(BigDecimal.ZERO) == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter regular or overtime hours greater than zero");
        }

        userRepository.findById(request.userId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected employee does not exist"));

        projectRepository.findById(request.projectId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected project does not exist"));

        ActivityEntity activity = activityRepository.findById(request.activityId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected activity does not exist"));

        if (!activity.getProjectId().equals(request.projectId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Activity must belong to the selected project");
        }

        if (Boolean.TRUE.equals(request.allocatedActivity())
            && !employeeAllocationRepository.existsByUserIdAndActivityIdAndActiveTrue(request.userId(), request.activityId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected employee is not actively allocated to this activity");
        }

        return activity;
    }

    private TimesheetEntryDto toDto(TimesheetEntryEntity entry) {
        UserEntity user = userRepository.findById(entry.getUserId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));
        ProjectEntity project = projectRepository.findById(entry.getProjectId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));
        ActivityEntity activity = activityRepository.findById(entry.getActivityId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Activity not found"));

        return new TimesheetEntryDto(
            entry.getId(),
            user.getId(),
            user.getUserCode(),
            user.getFullName(),
            project.getId(),
            project.getProjectCode(),
            project.getProjectName(),
            activity.getId(),
            activity.getActivityCode(),
            activity.getActivityName(),
            entry.getWorkDate(),
            entry.getRegularHours(),
            entry.getOvertimeHours(),
            entry.getAllocatedActivity(),
            entry.getStatus(),
            entry.getRemarks()
        );
    }

    private String normalizeRemarks(String remarks) {
        if (remarks == null) {
            return null;
        }
        String trimmed = remarks.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
