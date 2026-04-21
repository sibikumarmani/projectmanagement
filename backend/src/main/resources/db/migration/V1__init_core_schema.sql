CREATE TABLE projects (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    project_code VARCHAR(40) NOT NULL UNIQUE,
    project_name VARCHAR(255) NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    project_manager VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    budget_amount DECIMAL(18,2) NOT NULL
);

CREATE TABLE wbs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    project_id BIGINT NOT NULL,
    wbs_code VARCHAR(40) NOT NULL,
    wbs_name VARCHAR(255) NOT NULL,
    CONSTRAINT fk_wbs_project FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE TABLE activities (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    project_id BIGINT NOT NULL,
    wbs_id BIGINT,
    activity_code VARCHAR(40) NOT NULL,
    activity_name VARCHAR(255) NOT NULL,
    CONSTRAINT fk_activities_project FOREIGN KEY (project_id) REFERENCES projects(id),
    CONSTRAINT fk_activities_wbs FOREIGN KEY (wbs_id) REFERENCES wbs(id)
);

CREATE TABLE risks (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    project_id BIGINT,
    activity_id BIGINT,
    risk_no VARCHAR(40) NOT NULL,
    title VARCHAR(255) NOT NULL,
    CONSTRAINT fk_risks_project FOREIGN KEY (project_id) REFERENCES projects(id),
    CONSTRAINT fk_risks_activity FOREIGN KEY (activity_id) REFERENCES activities(id)
);
