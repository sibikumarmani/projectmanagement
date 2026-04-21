package com.company.pms.billing;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "billings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BillingEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "milestone_id", nullable = false)
    private Long milestoneId;

    @Column(name = "billing_no", nullable = false)
    private String billingNo;

    @Column(name = "billing_date", nullable = false)
    private LocalDate billingDate;

    @Column(name = "billed_amount", nullable = false)
    private BigDecimal billedAmount;

    @Column(name = "certified_amount", nullable = false)
    private BigDecimal certifiedAmount;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "remarks")
    private String remarks;
}
