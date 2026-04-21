package com.company.pms.risk;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDate;

@Entity
@Table(name = "risks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiskEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id")
    private Long projectId;

    @Column(name = "activity_id")
    private Long activityId;

    @Column(name = "risk_no", nullable = false)
    private String riskNo;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "category", nullable = false)
    private String category;

    @Column(name = "owner", nullable = false)
    private String owner;

    @Column(name = "probability", nullable = false)
    private Integer probability;

    @Column(name = "impact", nullable = false)
    private Integer impact;

    @Column(name = "severity", nullable = false)
    private Integer severity;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "target_date", nullable = false)
    private LocalDate targetDate;
}
