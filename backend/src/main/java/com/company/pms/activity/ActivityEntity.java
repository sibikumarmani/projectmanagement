package com.company.pms.activity;

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
@Table(name = "activities")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "wbs_id")
    private Long wbsId;

    @Column(name = "activity_code", nullable = false)
    private String activityCode;

    @Column(name = "activity_name", nullable = false)
    private String activityName;

    @Column(name = "planned_start", nullable = false)
    private LocalDate plannedStart;

    @Column(name = "planned_end", nullable = false)
    private LocalDate plannedEnd;

    @Column(name = "duration_days", nullable = false)
    private Integer durationDays;

    @Column(name = "progress_percent", nullable = false)
    private Integer progressPercent;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "responsible_user", nullable = false)
    private String responsibleUser;
}
