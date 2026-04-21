CREATE TABLE milestones (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    project_id BIGINT NOT NULL,
    wbs_id BIGINT,
    milestone_code VARCHAR(40) NOT NULL,
    milestone_name VARCHAR(255) NOT NULL,
    planned_date DATE NOT NULL,
    actual_date DATE NULL,
    status VARCHAR(50) NOT NULL,
    CONSTRAINT fk_milestones_project FOREIGN KEY (project_id) REFERENCES projects(id),
    CONSTRAINT fk_milestones_wbs FOREIGN KEY (wbs_id) REFERENCES wbs(id)
);

CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role_name VARCHAR(100) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE refresh_tokens (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    token VARCHAR(512) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id)
);

INSERT INTO milestones (
    id, project_id, wbs_id, milestone_code, milestone_name, planned_date, actual_date, status
) VALUES
    (1, 1, 1, 'MS-001', 'Site handover complete', DATE '2026-02-05', DATE '2026-02-03', 'COMPLETED'),
    (2, 1, 3, 'MS-002', 'Trenching package released', DATE '2026-04-30', NULL, 'IN_PROGRESS'),
    (3, 2, 5, 'MS-003', 'Dock slab approval', DATE '2026-05-10', NULL, 'AT_RISK'),
    (4, 3, 6, 'MS-004', 'Layout freeze sign-off', DATE '2026-05-20', NULL, 'PLANNED');

INSERT INTO users (
    id, email, password_hash, full_name, role_name, active
) VALUES
    (1, 'admin@pms.local', '$2y$10$r90o2B4HRTzxhpvODLiOPuX3Fqom/byIlYoOoOXHIx7uEMXZ12JGC', 'Priya Menon', 'ADMIN', TRUE);
