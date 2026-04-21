package com.company.pms.wbs;

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

import java.math.BigDecimal;

@Entity
@Table(name = "wbs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WbsEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "wbs_code", nullable = false)
    private String wbsCode;

    @Column(name = "wbs_name", nullable = false)
    private String wbsName;

    @Column(name = "level_no", nullable = false)
    private Integer levelNo;

    @Column(name = "progress_percent", nullable = false)
    private Integer progressPercent;

    @Column(name = "budget_amount", nullable = false)
    private BigDecimal budgetAmount;

    @Column(name = "actual_amount", nullable = false)
    private BigDecimal actualAmount;
}
