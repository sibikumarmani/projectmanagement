CREATE TABLE material_requests (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    request_no VARCHAR(40) NOT NULL UNIQUE,
    project_id BIGINT NOT NULL,
    activity_id BIGINT NOT NULL,
    requested_by VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    requested_qty DECIMAL(18,2) NOT NULL,
    approved_qty DECIMAL(18,2) NOT NULL,
    CONSTRAINT fk_material_requests_project FOREIGN KEY (project_id) REFERENCES projects(id),
    CONSTRAINT fk_material_requests_activity FOREIGN KEY (activity_id) REFERENCES activities(id)
);

INSERT INTO material_requests (
    id, request_no, project_id, activity_id, requested_by, status, requested_qty, approved_qty
) VALUES
    (1, 'MR-24018', 1, 2, 'Nitya V', 'APPROVED', 820.00, 800.00),
    (2, 'MR-24021', 2, 4, 'Sanjay K', 'PARTIALLY_RECEIVED', 1200.00, 1200.00),
    (3, 'MR-24034', 3, 5, 'Harish P', 'SUBMITTED', 240.00, 0.00);
