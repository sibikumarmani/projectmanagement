package com.company.pms.billing;

import com.company.pms.milestone.MilestoneEntity;
import com.company.pms.milestone.MilestoneRepository;
import com.company.pms.project.ProjectEntity;
import com.company.pms.project.ProjectRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class BillingService {

    private final BillingRepository billingRepository;
    private final ProjectRepository projectRepository;
    private final MilestoneRepository milestoneRepository;

    public BillingService(
        BillingRepository billingRepository,
        ProjectRepository projectRepository,
        MilestoneRepository milestoneRepository
    ) {
        this.billingRepository = billingRepository;
        this.projectRepository = projectRepository;
        this.milestoneRepository = milestoneRepository;
    }

    public List<BillingDto> getBillingsForProject(Long projectId) {
        validateProject(projectId);
        return billingRepository.findByProjectIdOrderByBillingDateDesc(projectId).stream()
            .map(this::toDto)
            .toList();
    }

    public BillingDto createBilling(Long projectId, BillingUpsertRequest request) {
        validateProject(projectId);
        if (billingRepository.existsByBillingNoIgnoreCase(request.billingNo())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Billing number already exists");
        }

        MilestoneEntity milestone = validateMilestone(projectId, request.milestoneId());
        validateAmounts(request);

        BillingEntity billing = BillingEntity.builder()
            .projectId(projectId)
            .milestoneId(request.milestoneId())
            .billingNo(request.billingNo())
            .billingDate(request.billingDate())
            .billedAmount(request.billedAmount())
            .certifiedAmount(request.certifiedAmount())
            .status(request.status())
            .remarks(normalizeRemarks(request.remarks()))
            .build();

        return toDto(billingRepository.save(billing), milestone);
    }

    public BillingDto updateBilling(Long projectId, Long id, BillingUpsertRequest request) {
        validateProject(projectId);

        BillingEntity billing = billingRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Billing not found"));

        if (!billing.getProjectId().equals(projectId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Billing does not belong to the selected project");
        }

        if (billingRepository.existsByBillingNoIgnoreCaseAndIdNot(request.billingNo(), id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Billing number already exists");
        }

        MilestoneEntity milestone = validateMilestone(projectId, request.milestoneId());
        validateAmounts(request);

        billing.setMilestoneId(request.milestoneId());
        billing.setBillingNo(request.billingNo());
        billing.setBillingDate(request.billingDate());
        billing.setBilledAmount(request.billedAmount());
        billing.setCertifiedAmount(request.certifiedAmount());
        billing.setStatus(request.status());
        billing.setRemarks(normalizeRemarks(request.remarks()));

        return toDto(billingRepository.save(billing), milestone);
    }

    private void validateProject(Long projectId) {
        projectRepository.findById(projectId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Project not found"));
    }

    private MilestoneEntity validateMilestone(Long projectId, Long milestoneId) {
        MilestoneEntity milestone = milestoneRepository.findById(milestoneId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Milestone not found"));

        if (!milestone.getProjectId().equals(projectId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Milestone does not belong to the selected project");
        }

        return milestone;
    }

    private void validateAmounts(BillingUpsertRequest request) {
        if (request.certifiedAmount().compareTo(request.billedAmount()) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Certified amount cannot exceed billed amount");
        }
    }

    private String normalizeRemarks(String remarks) {
        if (remarks == null || remarks.trim().isEmpty()) {
            return null;
        }
        return remarks.trim();
    }

    private BillingDto toDto(BillingEntity billing) {
        MilestoneEntity milestone = milestoneRepository.findById(billing.getMilestoneId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Milestone not found"));
        return toDto(billing, milestone);
    }

    private BillingDto toDto(BillingEntity billing, MilestoneEntity milestone) {
        return new BillingDto(
            billing.getId(),
            billing.getProjectId(),
            billing.getMilestoneId(),
            milestone.getMilestoneCode(),
            milestone.getMilestoneName(),
            billing.getBillingNo(),
            billing.getBillingDate(),
            billing.getBilledAmount(),
            billing.getCertifiedAmount(),
            billing.getStatus(),
            billing.getRemarks()
        );
    }
}
