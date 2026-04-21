INSERT INTO projects (
    id, project_code, project_name, client_name, project_manager, start_date, end_date,
    budget_amount, actual_amount, progress_percent, status
) VALUES
    (1, 'PRJ-2401', 'Metro Utility Corridor', 'City Infrastructure Board', 'Aarav Menon', DATE '2026-01-06', DATE '2026-11-30', 12600000.00, 11180000.00, 68, 'ACTIVE'),
    (2, 'PRJ-2408', 'North Hub Expansion', 'Mercury Logistics', 'Neha Iyer', DATE '2026-02-01', DATE '2026-10-15', 8900000.00, 5210000.00, 43, 'AT_RISK'),
    (3, 'PRJ-2412', 'Solar Assembly Line', 'Axis Renewables', 'Rohan Jain', DATE '2026-03-14', DATE '2027-01-20', 14300000.00, 1760000.00, 18, 'PLANNING');

INSERT INTO wbs (
    id, project_id, wbs_code, wbs_name, level_no, progress_percent, budget_amount, actual_amount
) VALUES
    (1, 1, '1.0', 'Site Establishment', 1, 80, 900000.00, 760000.00),
    (2, 1, '2.0', 'Underground Works', 1, 61, 3200000.00, 2940000.00),
    (3, 1, '2.1', 'Trenching & Protection', 2, 55, 1860000.00, 1745000.00),
    (4, 1, '3.0', 'MEP Integration', 1, 42, 4100000.00, 2980000.00),
    (5, 2, '1.0', 'Warehouse Civil Scope', 1, 38, 2100000.00, 1340000.00),
    (6, 3, '1.0', 'Line Design & Layout', 1, 18, 1150000.00, 230000.00);

INSERT INTO activities (
    id, project_id, wbs_id, activity_code, activity_name, planned_start, planned_end,
    duration_days, progress_percent, status, responsible_user
) VALUES
    (1, 1, 3, 'ACT-101', 'Excavation Zone A', DATE '2026-04-08', DATE '2026-04-28', 20, 72, 'IN_PROGRESS', 'Karthik R'),
    (2, 1, 4, 'ACT-114', 'Cable Tray Installation', DATE '2026-04-15', DATE '2026-05-06', 21, 35, 'DELAYED', 'Nitya V'),
    (3, 1, 4, 'ACT-126', 'Testing & Commissioning', DATE '2026-05-10', DATE '2026-05-20', 10, 0, 'NOT_STARTED', 'Harish P'),
    (4, 2, 5, 'ACT-205', 'Dock Reinforcement', DATE '2026-04-12', DATE '2026-05-02', 20, 48, 'IN_PROGRESS', 'Sanjay K'),
    (5, 3, 6, 'ACT-302', 'Production Line Modeling', DATE '2026-04-18', DATE '2026-05-04', 16, 18, 'IN_PROGRESS', 'Lavanya S');

INSERT INTO risks (
    id, project_id, activity_id, risk_no, title, category, owner, probability, impact, severity, status, target_date
) VALUES
    (1, 1, 1, 'RISK-001', 'Delayed authority approval for road cutting', 'Regulatory', 'Aarav Menon', 4, 5, 20, 'UNDER_REVIEW', DATE '2026-04-26'),
    (2, 2, 4, 'RISK-009', 'Imported panel delivery slips by two weeks', 'Procurement', 'Neha Iyer', 3, 5, 15, 'MITIGATION_IN_PROGRESS', DATE '2026-05-02'),
    (3, 1, 1, 'RISK-014', 'Heavy rainfall impact on trench stability', 'Execution', 'Karthik R', 4, 4, 16, 'OPEN', DATE '2026-04-24'),
    (4, 3, 5, 'RISK-021', 'Client sign-off may delay layout freeze', 'Stakeholder', 'Rohan Jain', 3, 4, 12, 'OPEN', DATE '2026-05-08');
