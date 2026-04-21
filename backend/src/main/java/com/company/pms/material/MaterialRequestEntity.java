package com.company.pms.material;

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

@Entity
@Table(name = "material_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaterialRequestEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "request_no", nullable = false)
    private String requestNo;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "activity_id", nullable = false)
    private Long activityId;

    @Column(name = "requested_by", nullable = false)
    private String requestedBy;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "requested_qty", nullable = false)
    private BigDecimal requestedQty;

    @Column(name = "approved_qty", nullable = false)
    private BigDecimal approvedQty;
}
