CREATE TABLE billings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    project_id BIGINT NOT NULL,
    milestone_id BIGINT NOT NULL,
    billing_no VARCHAR(40) NOT NULL UNIQUE,
    billing_date DATE NOT NULL,
    billed_amount DECIMAL(18,2) NOT NULL,
    certified_amount DECIMAL(18,2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    remarks VARCHAR(500),
    CONSTRAINT fk_billings_project FOREIGN KEY (project_id) REFERENCES projects(id),
    CONSTRAINT fk_billings_milestone FOREIGN KEY (milestone_id) REFERENCES milestones(id)
);

INSERT INTO billings (
    id, project_id, milestone_id, billing_no, billing_date, billed_amount, certified_amount, status, remarks
) VALUES
    (1, 1, 1, 'BILL-24001', DATE '2026-02-06', 450000.00, 450000.00, 'CERTIFIED', 'Initial site handover billing'),
    (2, 1, 2, 'BILL-24008', DATE '2026-04-30', 720000.00, 680000.00, 'SUBMITTED', 'Trenching package progress billing'),
    (3, 2, 3, 'BILL-24012', DATE '2026-05-11', 390000.00, 0.00, 'DRAFT', 'Dock slab approval milestone billing');
