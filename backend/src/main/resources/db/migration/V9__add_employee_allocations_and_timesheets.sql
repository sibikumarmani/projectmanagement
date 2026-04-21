CREATE TABLE employee_allocations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    project_id BIGINT NOT NULL,
    activity_id BIGINT NOT NULL,
    allocation_date DATE NOT NULL,
    allocation_percentage INT NOT NULL DEFAULT 100,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    remarks VARCHAR(500) NULL,
    CONSTRAINT fk_employee_allocations_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_employee_allocations_project FOREIGN KEY (project_id) REFERENCES projects(id),
    CONSTRAINT fk_employee_allocations_activity FOREIGN KEY (activity_id) REFERENCES activities(id)
);

CREATE INDEX idx_employee_allocations_user ON employee_allocations(user_id);
CREATE INDEX idx_employee_allocations_project ON employee_allocations(project_id);
CREATE INDEX idx_employee_allocations_activity ON employee_allocations(activity_id);

CREATE TABLE timesheet_entries (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    project_id BIGINT NOT NULL,
    activity_id BIGINT NOT NULL,
    work_date DATE NOT NULL,
    regular_hours DECIMAL(6,2) NOT NULL DEFAULT 0.00,
    overtime_hours DECIMAL(6,2) NOT NULL DEFAULT 0.00,
    allocated_activity BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(50) NOT NULL DEFAULT 'SUBMITTED',
    remarks VARCHAR(500) NULL,
    CONSTRAINT fk_timesheet_entries_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_timesheet_entries_project FOREIGN KEY (project_id) REFERENCES projects(id),
    CONSTRAINT fk_timesheet_entries_activity FOREIGN KEY (activity_id) REFERENCES activities(id)
);

CREATE INDEX idx_timesheet_entries_user ON timesheet_entries(user_id);
CREATE INDEX idx_timesheet_entries_project ON timesheet_entries(project_id);
CREATE INDEX idx_timesheet_entries_activity ON timesheet_entries(activity_id);
CREATE INDEX idx_timesheet_entries_work_date ON timesheet_entries(work_date);
