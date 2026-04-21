package com.company.pms.allocation;

import com.company.pms.activity.ActivityEntity;
import com.company.pms.activity.ActivityRepository;
import com.company.pms.auth.UserEntity;
import com.company.pms.auth.UserRepository;
import com.company.pms.project.ProjectEntity;
import com.company.pms.project.ProjectRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class EmployeeAllocationService {

    private final EmployeeAllocationRepository employeeAllocationRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final ActivityRepository activityRepository;

    public EmployeeAllocationService(
        EmployeeAllocationRepository employeeAllocationRepository,
        UserRepository userRepository,
        ProjectRepository projectRepository,
        ActivityRepository activityRepository
    ) {
        this.employeeAllocationRepository = employeeAllocationRepository;
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.activityRepository = activityRepository;
    }

    @Transactional(readOnly = true)
    public List<EmployeeAllocationDto> getAllocations() {
        return employeeAllocationRepository.findAllByOrderByAllocationDateDescIdDesc().stream()
            .map(this::toDto)
            .toList();
    }

    @Transactional
    public EmployeeAllocationDto createAllocation(EmployeeAllocationUpsertRequest request) {
        ActivityEntity activity = validateRequest(request);

        EmployeeAllocationEntity allocation = employeeAllocationRepository.save(
            EmployeeAllocationEntity.builder()
                .userId(request.userId())
                .projectId(request.projectId())
                .activityId(activity.getId())
                .allocationDate(request.allocationDate())
                .allocationPercentage(request.allocationPercentage())
                .active(request.active())
                .remarks(normalizeRemarks(request.remarks()))
                .build()
        );

        return toDto(allocation);
    }

    @Transactional
    public EmployeeAllocationDto updateAllocation(Long id, EmployeeAllocationUpsertRequest request) {
        EmployeeAllocationEntity allocation = employeeAllocationRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Allocation not found"));

        ActivityEntity activity = validateRequest(request);

        allocation.setUserId(request.userId());
        allocation.setProjectId(request.projectId());
        allocation.setActivityId(activity.getId());
        allocation.setAllocationDate(request.allocationDate());
        allocation.setAllocationPercentage(request.allocationPercentage());
        allocation.setActive(request.active());
        allocation.setRemarks(normalizeRemarks(request.remarks()));

        return toDto(employeeAllocationRepository.save(allocation));
    }

    private ActivityEntity validateRequest(EmployeeAllocationUpsertRequest request) {
        userRepository.findById(request.userId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected employee does not exist"));

        projectRepository.findById(request.projectId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected project does not exist"));

        ActivityEntity activity = activityRepository.findById(request.activityId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected activity does not exist"));

        if (!activity.getProjectId().equals(request.projectId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Activity must belong to the selected project");
        }

        return activity;
    }

    private EmployeeAllocationDto toDto(EmployeeAllocationEntity allocation) {
        UserEntity user = userRepository.findById(allocation.getUserId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));
        ProjectEntity project = projectRepository.findById(allocation.getProjectId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));
        ActivityEntity activity = activityRepository.findById(allocation.getActivityId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Activity not found"));

        return new EmployeeAllocationDto(
            allocation.getId(),
            user.getId(),
            user.getUserCode(),
            user.getFullName(),
            project.getId(),
            project.getProjectCode(),
            project.getProjectName(),
            activity.getId(),
            activity.getActivityCode(),
            activity.getActivityName(),
            allocation.getAllocationDate(),
            allocation.getAllocationPercentage(),
            allocation.getActive(),
            allocation.getRemarks()
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
