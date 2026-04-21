package com.company.pms.timesheet;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TimesheetEntryRepository extends JpaRepository<TimesheetEntryEntity, Long> {

    List<TimesheetEntryEntity> findAllByOrderByWorkDateDescIdDesc();
}
