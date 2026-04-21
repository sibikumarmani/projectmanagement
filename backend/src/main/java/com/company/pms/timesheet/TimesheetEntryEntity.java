package com.company.pms.timesheet;

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
@Table(name = "timesheet_entries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimesheetEntryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "activity_id", nullable = false)
    private Long activityId;

    @Column(name = "work_date", nullable = false)
    private LocalDate workDate;

    @Column(name = "regular_hours", nullable = false)
    private BigDecimal regularHours;

    @Column(name = "overtime_hours", nullable = false)
    private BigDecimal overtimeHours;

    @Column(name = "allocated_activity", nullable = false)
    private Boolean allocatedActivity;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "remarks")
    private String remarks;
}
