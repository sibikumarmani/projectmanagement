# Project Management and Cost Control System — Technical Specification

## 1. System Overview

### 1.1 Project Name
**Project Management and Cost Control System**

### 1.2 Objective
Build a web-based enterprise system to manage:
- project planning
- WBS and activity structure
- cost planning
- resource allocation
- material flow
- labour tracking
- actual cost capture
- risk tracking
- dashboard reporting

### 1.3 Users
- Admin
- Project Manager
- Planning Engineer
- Site Engineer
- Store / Inventory User
- Cost Controller
- Finance User
- Management Viewer

---

## 2. Technology Stack

### 2.1 Frontend
- **Framework:** Next.js
- **Language:** TypeScript
- **UI Library:** React
- **State Management:** Redux Toolkit or Zustand
- **Form Handling:** React Hook Form
- **Validation:** Zod or Yup
- **UI Components:** Material UI / Ant Design / custom component library
- **Charts:** Recharts / Chart.js / ECharts
- **Gantt:** dhtmlxGantt / frappe-gantt / Syncfusion Gantt
- **HTTP Client:** Axios
- **Authentication Handling:** JWT token + refresh token
- **Routing:** App Router in Next.js
- **Styling:** Tailwind CSS or Material UI styling

### 2.2 Backend
- **Language:** Java
- **Framework:** Spring Boot
- **Build Tool:** Maven or Gradle
- **Architecture:** Layered architecture with modular domain separation
- **Security:** Spring Security + JWT
- **ORM:** Spring Data JPA / Hibernate
- **Validation:** Jakarta Bean Validation
- **API Standard:** REST API
- **Documentation:** Swagger / OpenAPI
- **Mapping:** MapStruct
- **Logging:** SLF4J + Logback
- **File Storage:** Local / S3-compatible object storage for attachments
- **Scheduling Jobs:** Spring Scheduler / Quartz for periodic jobs

### 2.3 Database
- **Database:** MySQL 8+
- **Migration Tool:** Flyway or Liquibase
- **Connection Pool:** HikariCP
- **Backup Strategy:** Daily backup + transaction-log-based restore plan

### 2.4 Deployment
- Frontend deployed on Vercel / Nginx server
- Backend deployed on Linux VM / Docker / Kubernetes
- MySQL hosted on managed DB or cloud VM
- Reverse proxy through Nginx
- HTTPS with SSL

---

## 3. High-Level Architecture

### 3.1 Frontend Architecture
Next.js application with:
- authentication pages
- master data screens
- project planning module
- costing module
- execution module
- reporting module

#### Main frontend layers
- UI components
- page containers
- API service layer
- auth/session handling
- state store
- validation and form models

### 3.2 Backend Architecture
Use a **modular monolith** first.

This is better than microservices for this scope because:
- faster development
- easier transaction handling
- simpler deployment
- easier reporting joins

#### Suggested package structure
- auth
- user
- role
- master
- project
- wbs
- milestone
- activity
- budgeting
- allocation
- material
- timesheet
- actualcost
- overhead
- risk
- reporting
- common
- audit
- notification

#### Standard backend layers
- Controller
- Service
- Repository
- DTO
- Entity
- Mapper
- Validator
- Exception handler

### 3.3 Database Architecture
Use normalized relational design with clear foreign keys.

Main hierarchy:

**Project → WBS → Activity → Budget / Allocation / Request / Receipt / Timesheet / Actual / Risk**

---

## 4. Functional Modules

### 4.1 Authentication and Authorization

#### Features
- Login
- Logout
- Password reset
- Change password
- User creation
- Role assignment
- Permission mapping
- Session management

#### Security model
Use:
- JWT access token
- refresh token
- role-based access control
- permission-based screen and action control

#### Example permissions
- PROJECT_CREATE
- PROJECT_EDIT
- WBS_CREATE
- ACTIVITY_CREATE
- BUDGET_APPROVE
- MATERIAL_REQUEST_CREATE
- MATERIAL_RECEIPT_CREATE
- TIMESHEET_APPROVE
- ACTUAL_ENTRY_CREATE
- RISK_EDIT
- DASHBOARD_VIEW

### 4.2 Master Data Module

#### Masters required
- Company
- Business unit
- Project type
- Client
- Unit of measure
- Material master
- Labour master
- Overhead master
- Employee master
- Vendor master
- Resource category
- Cost code
- Currency
- Calendar / holidays
- Risk category
- Activity type
- Status master

#### Purpose
All transactions should use validated master data. Avoid free-text in critical business fields.

### 4.3 Project Module

#### Features
- Create project
- Edit project
- Activate / close project
- Assign project manager
- Define project dates
- Define budget and metadata

#### Main fields
- `project_code`
- `project_name`
- `client_id`
- `project_type_id`
- `start_date`
- `end_date`
- `location`
- `status`
- `project_manager_id`
- `approved_budget`

### 4.4 WBS Module

#### Features
- Create hierarchical WBS
- Parent-child structure
- WBS tree view
- WBS code generation
- Budget rollup
- Progress rollup

#### Rules
- WBS belongs to one project
- WBS may have parent WBS
- Activities are created under WBS
- WBS code must be unique within a project

### 4.5 Milestone Module

#### Features
- Create milestone
- Link milestone to project or WBS
- Planned date
- Actual date
- Status tracking
- milestone dependency reference

#### Fields
- `milestone_code`
- `milestone_name`
- `project_id`
- `wbs_id` (nullable)
- `planned_date`
- `actual_date`
- `status`

### 4.6 Activity Module

#### Features
- Create activities under WBS
- Define planned dates
- Duration
- Dependency
- Progress tracking
- Responsible user

#### Fields
- `activity_code`
- `activity_name`
- `project_id`
- `wbs_id`
- `activity_type_id`
- `planned_start`
- `planned_end`
- `duration_days`
- `dependency_type`
- `predecessor_activity_id`
- `progress_percent`
- `status`

#### Rules
- Activity must belong to WBS
- No activity without project and WBS
- Dependency must reference same project activities

### 4.7 Budgeting Module

#### Features
Activity-wise budget entry split by:
- Material
- Labour
- Overhead

#### Structure
- `activity_budget_header`
- `activity_budget_line`

#### Budget line fields
- `project_id`
- `wbs_id`
- `activity_id`
- `cost_type`
- `resource_id`
- `quantity`
- `unit_rate`
- `amount`

#### Cost types
- MATERIAL
- LABOUR
- OVERHEAD

#### Rules
- Budget must be entered at activity level
- Budget lines should roll up to WBS and project totals
- Revisions should be version controlled

### 4.8 Allocation Module

#### Features
- allocate material to activity
- allocate labour to activity
- allocate overhead basis if needed
- compare allocated vs budget

#### Fields
- `allocation_no`
- `project_id`
- `wbs_id`
- `activity_id`
- `allocation_type`
- `resource_id`
- `allocated_qty`
- `allocated_amount`
- `allocation_date`

#### Rules
- allocation should not exceed budget unless user has override permission
- allocation audit trail required

### 4.9 Material Request Module

#### Features
- create request against activity
- approval workflow
- partial request handling
- request status tracking

#### Fields
- `request_no`
- `request_date`
- `project_id`
- `wbs_id`
- `activity_id`
- `requested_by`
- `status`

#### Request line fields
- `material_id`
- `requested_qty`
- `approved_qty`
- `remarks`

#### Workflow
Draft → Submitted → Approved → Rejected → Partially Received → Fully Received

### 4.10 Material Receipt Module

#### Features
- record material received
- link with request
- support partial receipts
- store location handling
- quantity reconciliation

#### Fields
- `receipt_no`
- `receipt_date`
- `project_id`
- `request_id`
- `received_by`
- `store_location`
- `status`

#### Receipt line fields
- `material_id`
- `received_qty`
- `accepted_qty`
- `rejected_qty`
- `unit_rate`
- `amount`

#### Rules
- receipt cannot exceed approved pending quantity unless override
- receipt should update material actuals or stock movement table

### 4.11 Timesheet Module

#### Features
- daily labour hour entry
- employee-wise time capture
- activity linkage
- supervisor approval
- labour cost generation

#### Fields
- `timesheet_no`
- `employee_id`
- `date`
- `project_id`
- `wbs_id`
- `activity_id`
- `labour_id`
- `regular_hours`
- `overtime_hours`
- `status`

#### Workflow
Draft → Submitted → Approved → Posted

#### Rules
- timesheet hours should feed labour actuals
- one employee can have multiple activity entries per day
- duplicate overlap validation needed

### 4.12 Actual Entry Module

#### Features
- actual material cost entry
- actual labour cost entry
- actual overhead cost entry
- integration from material receipt and timesheet
- manual adjustment entries

#### Fields
- `entry_no`
- `entry_date`
- `project_id`
- `wbs_id`
- `activity_id`
- `cost_type`
- `reference_type`
- `reference_id`
- `resource_id`
- `quantity`
- `rate`
- `amount`
- `remarks`

#### Reference types
- MATERIAL_RECEIPT
- TIMESHEET
- OVERHEAD_ALLOCATION
- MANUAL_ENTRY

### 4.13 Overhead Allocation Module

#### Features
- periodic overhead allocation
- allocation basis configuration
- posting to actuals

#### Allocation methods
- fixed amount
- by labour hours
- by material cost
- by activity weight
- by budget proportion
- by WBS proportion

#### Fields
- `period_month`
- `project_id`
- `wbs_id`
- `activity_id`
- `overhead_id`
- `allocation_basis`
- `base_value`
- `allocated_amount`
- `posted_flag`

### 4.14 Gantt Chart Module

#### Features
- WBS and activity timeline view
- milestone visualization
- dependency visualization
- baseline vs actual comparison
- progress percentage
- filtering by project / WBS / status

#### Data source
- Project
- WBS
- Activities
- Milestones
- Dependencies
- Progress updates

#### Functions
- view gantt
- update schedule
- drag reschedule if permission granted
- critical delay highlighting

### 4.15 Risk Management Module

#### Features
- risk register
- severity scoring
- owner assignment
- mitigation tracking
- closure tracking

#### Fields
- `risk_no`
- `project_id`
- `wbs_id` (nullable)
- `activity_id` (nullable)
- `risk_category_id`
- `title`
- `description`
- `probability`
- `impact`
- `severity`
- `owner_id`
- `mitigation_plan`
- `target_date`
- `status`

#### Risk scoring
**severity = probability × impact**

#### Workflow
Open → Under Review → Mitigation In Progress → Closed → Escalated

### 4.16 Dashboard and Reporting Module

#### Dashboard widgets
- total active projects
- budget vs actual
- project progress %
- delayed milestones
- pending material requests
- partial receipts
- labour hours utilization
- overhead posted this month
- top risks
- activity status summary

#### Reports
- project summary report
- WBS cost report
- activity budget vs actual report
- material request vs receipt report
- timesheet utilization report
- overhead allocation report
- milestone tracking report
- risk register report
- progress summary report

---

## 5. Non-Functional Requirements

### 5.1 Performance
- page response target under 3 seconds for standard screens
- report filters optimized with indexing
- lazy loading for large WBS/activity trees
- pagination for listing screens
- async report generation for heavy reports

### 5.2 Security
- JWT authentication
- password hashing with BCrypt
- RBAC and action-level permission checks
- input validation on frontend and backend
- audit log for create/update/delete/approve/post actions
- HTTPS only
- secure headers
- CSRF strategy if cookie-based auth is used

### 5.3 Scalability
- start as modular monolith
- keep domains clean so future service extraction is possible
- use queue or scheduler for heavy jobs

### 5.4 Availability
- daily DB backup
- error logging and alerting
- health check endpoints

### 5.5 Auditability
Store:
- who created
- who updated
- when created
- when updated
- previous and current values for sensitive transactions

---

## 6. API Design

Use REST APIs.

### Example endpoint groups

#### Auth
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

#### Users and roles
- `GET /api/users`
- `POST /api/users`
- `GET /api/roles`
- `POST /api/roles`

#### Project
- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/{id}`
- `PUT /api/projects/{id}`

#### WBS
- `GET /api/projects/{projectId}/wbs`
- `POST /api/projects/{projectId}/wbs`

#### Milestone
- `GET /api/projects/{projectId}/milestones`
- `POST /api/projects/{projectId}/milestones`

#### Activities
- `GET /api/projects/{projectId}/activities`
- `POST /api/projects/{projectId}/activities`
- `PUT /api/activities/{id}`

#### Budget
- `GET /api/activities/{activityId}/budget`
- `POST /api/activities/{activityId}/budget`

#### Allocation
- `POST /api/allocations`
- `GET /api/allocations`

#### Material Request
- `POST /api/material-requests`
- `GET /api/material-requests`
- `POST /api/material-requests/{id}/submit`
- `POST /api/material-requests/{id}/approve`

#### Material Receipt
- `POST /api/material-receipts`
- `GET /api/material-receipts`

#### Timesheet
- `POST /api/timesheets`
- `GET /api/timesheets`
- `POST /api/timesheets/{id}/approve`

#### Actual Entry
- `POST /api/actual-entries`
- `GET /api/actual-entries`

#### Overhead Allocation
- `POST /api/overhead-allocations/run`
- `GET /api/overhead-allocations`

#### Risk
- `POST /api/risks`
- `GET /api/risks`
- `PUT /api/risks/{id}`

#### Dashboard
- `GET /api/dashboard/summary`
- `GET /api/dashboard/project/{projectId}`

#### Reports
- `GET /api/reports/budget-vs-actual`
- `GET /api/reports/material-request-vs-receipt`
- `GET /api/reports/timesheet-utilization`

---

## 7. Database Design

### 7.1 Core Tables

#### Security tables
- users
- roles
- permissions
- user_roles
- role_permissions
- refresh_tokens

#### Master tables
- clients
- project_types
- uom_master
- material_master
- labour_master
- overhead_master
- employee_master
- vendor_master
- activity_type_master
- risk_category_master
- cost_code_master
- holiday_calendar

#### Project structure tables
- projects
- project_members
- wbs
- milestones
- activities
- activity_dependencies

#### Planning and costing tables
- activity_budget_headers
- activity_budget_lines
- resource_allocations

#### Material tables
- material_requests
- material_request_lines
- material_receipts
- material_receipt_lines
- inventory_transactions

#### Labour and actual tables
- timesheet_headers
- timesheet_lines
- actual_entries
- overhead_allocations

#### Risk and progress tables
- risks
- risk_actions
- progress_updates

#### Reporting and audit
- audit_logs
- dashboard_cache
- attachments

### 7.2 Important key relationships
- `projects.id` → `wbs.project_id`
- `wbs.id` → `activities.wbs_id`
- `projects.id` → `activities.project_id`
- `activities.id` → `activity_budget_lines.activity_id`
- `activities.id` → `resource_allocations.activity_id`
- `activities.id` → `material_requests.activity_id`
- `material_requests.id` → `material_request_lines.request_id`
- `material_requests.id` → `material_receipts.request_id`
- `activities.id` → `timesheet_lines.activity_id`
- `activities.id` → `actual_entries.activity_id`
- `activities.id` → `risks.activity_id`

---

## 8. Suggested MySQL Table Model Sample

### `projects`
- `id`
- `project_code`
- `project_name`
- `client_id`
- `project_type_id`
- `start_date`
- `end_date`
- `location`
- `budget_amount`
- `status`
- `project_manager_id`
- `created_at`
- `updated_at`
- `created_by`
- `updated_by`

### `wbs`
- `id`
- `project_id`
- `parent_wbs_id`
- `wbs_code`
- `wbs_name`
- `level_no`
- `planned_start`
- `planned_end`
- `status`

### `activities`
- `id`
- `project_id`
- `wbs_id`
- `activity_code`
- `activity_name`
- `activity_type_id`
- `planned_start`
- `planned_end`
- `duration_days`
- `progress_percent`
- `status`
- `responsible_user_id`

### `activity_budget_lines`
- `id`
- `project_id`
- `wbs_id`
- `activity_id`
- `cost_type`
- `resource_type`
- `resource_id`
- `quantity`
- `unit_rate`
- `amount`

### `material_request_lines`
- `id`
- `request_id`
- `material_id`
- `requested_qty`
- `approved_qty`
- `remarks`

### `timesheet_lines`
- `id`
- `timesheet_id`
- `employee_id`
- `project_id`
- `wbs_id`
- `activity_id`
- `labour_id`
- `regular_hours`
- `overtime_hours`
- `status`

### `actual_entries`
- `id`
- `entry_no`
- `entry_date`
- `project_id`
- `wbs_id`
- `activity_id`
- `cost_type`
- `resource_id`
- `quantity`
- `rate`
- `amount`
- `reference_type`
- `reference_id`

---

## 9. Frontend Specification with Next.js

### 9.1 Frontend folder structure
```bash
src/
  app/
    login/
    dashboard/
    projects/
    wbs/
    milestones/
    activities/
    budgets/
    allocations/
    material-requests/
    material-receipts/
    timesheets/
    actual-entries/
    overhead/
    risks/
    reports/
  components/
    common/
    forms/
    tables/
    gantt/
    charts/
  services/
    api.ts
    auth.service.ts
    project.service.ts
    activity.service.ts
  store/
  hooks/
  types/
  utils/
```

### 9.2 Frontend pages
- Login page
- Dashboard page
- Project list and create page
- WBS tree page
- Milestone page
- Activity planning page
- Budget entry page
- Allocation page
- Material request page
- Material receipt page
- Timesheet page
- Actual entry page
- Overhead allocation page
- Gantt chart page
- Risk register page
- Reports page

### 9.3 Frontend component requirements
- reusable data table
- filter panel
- form modal / drawer
- approval action panel
- WBS tree viewer
- gantt timeline component
- dashboard cards
- export buttons

### 9.4 Frontend auth flow
- login page receives JWT
- store access token securely
- silent refresh with refresh token
- protected routes through middleware
- hide unauthorized menus and buttons

---

## 10. Backend Specification with Spring Boot

### 10.1 Suggested project structure
```bash
com.company.pms
  auth
  user
  role
  master
  project
  wbs
  milestone
  activity
  budgeting
  allocation
  material
  timesheet
  actualcost
  overhead
  risk
  reporting
  common
  config
  security
  audit
```

### 10.2 Standard backend components per module
- Controller
- Service
- Repository
- Entity
- DTO
- Mapper
- Specification / filter
- Validator

### 10.3 Cross-cutting backend components
- global exception handler
- response wrapper
- audit interceptor
- security filter
- file upload service
- scheduler for monthly overhead allocation
- report export service

---

## 11. Business Rules

These should be enforced in backend validation.

- User must have permission for each action
- Project code must be unique
- WBS code unique within project
- Activity code unique within project
- Activity cannot exist without WBS
- Budget must reference valid activity
- Allocation should not exceed budget unless privileged override
- Material request must reference valid activity
- Material receipt cannot exceed approved pending quantity
- Timesheet cannot exceed allowed daily hour limit
- Approved timesheet can post labour actuals
- Actual entries must map to project + WBS + activity
- Overhead allocation should be period based and re-runnable with controls
- Risk severity auto-calculated
- Dashboard should include only approved or posted transactional data

---

## 12. Reporting Logic

### Main metrics
- planned budget
- allocated budget
- actual cost
- cost variance
- planned progress
- actual progress
- material request pending qty
- material receipt completion %
- labour hour utilization
- overhead actual amount
- open risks by severity
- milestone delay count

### Formula examples
- **Cost Variance = Budget - Actual**
- **Material Pending = Approved Qty - Received Qty**
- **Labour Cost = Hours × Rate**
- **Risk Severity = Probability × Impact**

---

## 13. Recommended Implementation Phases

### Phase 1
- auth
- roles and permissions
- master data
- project creation

### Phase 2
- WBS
- milestones
- activities
- dependencies
- basic Gantt

### Phase 3
- activity budget
- allocation
- budget summary reports

### Phase 4
- material request
- material receipt
- inventory transactions

### Phase 5
- timesheet
- actual entry
- labour actual posting
- overhead allocation

### Phase 6
- risk management
- dashboard
- final reports
- audit and export

---

## 14. Recommended Development Standards

### Frontend
- TypeScript strict mode
- reusable form components
- centralized API layer
- route guards
- consistent error handling
- skeleton loaders and pagination

### Backend
- DTO-based API
- never expose entities directly
- service-layer business validation
- soft delete where needed
- transaction management on posting operations
- OpenAPI documentation
- unit tests for services
- integration tests for core flows

### Database
- use foreign keys
- create indexes on:
  - `project_id`
  - `wbs_id`
  - `activity_id`
  - `request_no`
  - `receipt_no`
  - `entry_date`
  - `status`
- maintain `created_at`, `updated_at`, `created_by`, `updated_by` in all core tables

---

## 15. Suggested Tools

### Development
- IntelliJ IDEA for Java
- VS Code for Next.js
- MySQL Workbench
- Postman
- Docker
- GitHub / GitLab

### CI/CD
- GitHub Actions / GitLab CI
- Docker build pipeline
- separate dev, test, prod environments

---

## 16. Final Recommendation

For this stack, the best approach is:
- **Frontend:** Next.js + TypeScript + Redux Toolkit + Tailwind or Material UI
- **Backend:** Spring Boot + Spring Security + JPA + Flyway
- **Database:** MySQL 8
- **Architecture:** modular monolith
- **Auth:** JWT + refresh token
- **API:** REST
- **Reports:** API-driven with export to Excel/PDF later

Most important design principle:

**Everything should be linked through:**

**Project → WBS → Activity**

All costing, requests, receipts, timesheets, risks, and reports should use that same structure.
