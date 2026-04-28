# AGENTS.md

## Purpose

This repository is a **full-stack Project Management and Cost Control System** for construction or project-controls workflows.

If an agent uses this file to recreate the product, the result should be a project that looks and behaves like this repository:

- authenticated multi-user web application
- enterprise-style operational UI
- modular monolith backend
- MySQL + Flyway persistence
- project planning centered on `Project -> WBS -> Activity`
- transactional modules for materials, billing, allocation, and timesheets
- dashboards and reports
- an AI-assisted record creation side panel

This file is both:

- a build specification for recreating the same style of project
- an operating guide for future changes inside this repo

---

## Product Identity

### Product name

Use a name equivalent to:

- `Project Management and Cost Control System`
- `PMS Control Center`
- `Project Management & Cost Control`

### Product goal

Support end-to-end project-controls work for:

- project registration
- WBS planning
- activity planning
- milestone management
- budgeting
- employee allocations
- timesheets
- material requests
- billing
- risk tracking
- dashboards and reports
- agent-assisted record creation

### Core hierarchy

The central business hierarchy is mandatory and must remain the source of truth:

**Project -> WBS -> Activity**

Nearly every module hangs off this chain. When reproducing or extending the system:

- WBS belongs to a project
- activity belongs to both a project and a WBS
- milestones are project-level and may optionally reference WBS
- material requests, risks, allocations, and timesheets must ultimately resolve to valid project/activity context

---

## Exact Tech Stack

Recreate the project using this stack unless the user explicitly asks for a change.

### Frontend

- Next.js `16.2.x` with App Router
- React `19`
- TypeScript
- Tailwind CSS `4`
- Zustand
- React Hook Form
- Zod
- Axios
- Recharts
- Lucide React icons
- `jspdf` for export/report generation support

Frontend lives in:

- `frontend/`

### Backend

- Spring Boot `3.3.x`
- Java `17`
- Spring Web
- Spring Data JPA
- Spring Security
- Spring Validation
- Spring Actuator
- Flyway
- MySQL
- Springdoc OpenAPI UI
- MapStruct
- Lombok
- JWT via `jjwt`

Backend lives in:

- `backend/`

### Agent service

- Python `3.12`
- FastAPI
- Uvicorn
- HTTPX

Agent service lives in:

- `agent-python/`

### Orchestration

- Docker Compose
- separate containers for:
  - `mysql`
  - `backend`
  - `agent-python`
  - `frontend`

---

## Repository Shape

The recreated project should follow this top-level structure:

- `frontend/`
- `backend/`
- `agent-python/`
- `scripts/`
- `.github/`
- `compose.yaml`
- root `AGENTS.md`

### Frontend structure

Important directories:

- `frontend/src/app/`
- `frontend/src/components/`
- `frontend/src/lib/`
- `frontend/src/store/`
- `frontend/public/`

Current route set to preserve:

- `/login`
- `/dashboard`
- `/projects`
- `/projects/[projectId]`
- `/wbs`
- `/activities`
- `/milestones`
- `/budgets`
- `/employee-allocations`
- `/timesheets`
- `/material-requests`
- `/billing`
- `/risks`
- `/gantt`
- `/reports`
- `/users`
- `/agent`

Current shared component families:

- layout:
  - `app-shell`
  - `layout-wrapper`
  - `menu-bar`
  - `top-bar`
- common:
  - `section-card`
  - `data-table`
  - `sidebar-drawer`
  - `stat-card`
- business forms:
  - activity form
  - billing form
  - employee allocation form
  - material request form
  - milestone form
  - project form
  - project workspace editor
  - risk form
  - timesheet form
  - user form
  - WBS form
- dashboard:
  - charts
- agent:
  - side-panel chat UI

### Backend structure

Base package:

- `backend/src/main/java/com/company/pms/`

Important support areas:

- `common/api`
- `common/config`
- `security`

Current business modules:

- `activity`
- `agent`
- `allocation`
- `auth`
- `billing`
- `dashboard`
- `material`
- `milestone`
- `notification`
- `project`
- `risk`
- `timesheet`
- `wbs`

### Database migrations

Recreated project should use Flyway with versioned SQL migrations in:

- `backend/src/main/resources/db/migration/`

Current migration progression:

- `V1__init_core_schema.sql`
- `V2__expand_core_schema.sql`
- `V3__seed_core_data.sql`
- `V4__add_milestones_and_auth.sql`
- `V5__add_registration_verification.sql`
- `V6__add_password_reset_codes.sql`
- `V7__add_material_requests.sql`
- `V8__add_billings.sql`
- `V9__add_employee_allocations_and_timesheets.sql`
- `V10__add_user_avatar_image.sql`

This sequence reflects real project evolution and is a good template for similar repos.

---

## Architectural Model

### Overall style

Build and maintain this application as a **modular monolith**.

That means:

- one Spring Boot backend
- clean business modules
- internal separation by ownership
- no premature microservice splitting

### Backend design expectations

Each module should trend toward this internal shape:

- controller
- service
- repository
- dto
- entity
- mapper
- validator or business rule helper

Rules:

- never expose JPA entities directly from controllers
- put business rules in services, not only annotations
- keep transactional logic explicit
- keep module ownership clear
- use DTO request/response contracts

### Frontend design expectations

Use this layering:

- pages and route composition in `src/app`
- business UI in `src/components`
- API utilities in `src/lib`
- shared state in Zustand only when truly shared
- forms with React Hook Form + Zod

Rules:

- respect Next.js App Router conventions
- prefer server-safe patterns
- avoid unnecessary client components
- preserve the existing operational enterprise style

---

## Required UX Style

When recreating this project, the UI should feel like this repository:

- clean enterprise application
- large operational cards and tables
- soft layered backgrounds
- strong top navigation and workspace shell
- practical forms with clear labels
- no consumer-app whimsy
- no flashy marketing-site patterns

The current UI language includes:

- persistent top app bar
- secondary menu bar for modules
- page shell with large bordered content surface
- card-based sections
- right-side drawer forms
- dashboard stat cards and charts
- agent sidebar launched from floating action button

### Theme behavior

The frontend already supports:

- light mode
- dark mode
- custom accent color selection
- theme persistence via local storage
- theme tokens in global CSS

If rebuilding, include the same theming capability rather than a fixed palette.

---

## Business Modules To Recreate

The project should include these modules.

### 1. Authentication and account management

Must include:

- login
- registration
- email verification
- resend verification code
- forgot password
- reset password
- refresh token flow
- current account profile
- change password
- profile image/avatar support
- admin user management

### 2. Projects

Must include:

- project register
- create project
- edit project
- project detail/workspace page

Typical project fields:

- `projectCode`
- `projectName`
- `clientName`
- `projectManager`
- `startDate`
- `endDate`
- `budgetAmount`
- status/progress/actual summary values

### 3. WBS

Must include:

- WBS listing
- WBS create/edit
- project-linked WBS hierarchy

Typical fields:

- `wbsCode`
- `wbsName`
- `levelNo`
- `progressPercent`
- `budgetAmount`
- `actualAmount`

### 4. Activities

Must include:

- activity list
- activity create/edit
- planning dates
- responsible user
- progress and status

Typical fields:

- `activityCode`
- `activityName`
- `projectId`
- `wbsId`
- `plannedStart`
- `plannedEnd`
- `durationDays`
- `progressPercent`
- `status`
- `responsibleUser`

### 5. Milestones

Must include:

- milestone list
- create/edit milestone
- project-linked dates

Typical fields:

- `milestoneCode`
- `milestoneName`
- `projectId`
- `wbsId`
- `plannedDate`
- `actualDate`
- `status`

### 6. Budgeting

Current repo has a budgets page and dashboard/reporting treatment. Recreated project should keep budgeting tied to activities, not project-only summary numbers.

### 7. Employee allocations

Must include:

- allocation CRUD
- employee-to-project/activity assignment
- allocation date
- percentage allocation
- active flag
- remarks

### 8. Timesheets

Must include:

- timesheet CRUD
- employee, project, activity linkage
- work date
- regular hours
- overtime hours
- allocation-aware validation
- status
- remarks

### 9. Material requests

Must include:

- material request CRUD
- activity reference
- requested, approved, and pending quantities
- approval-style statuses

### 10. Billing

Must include:

- billing record CRUD
- project and milestone linkage
- billed amount
- certified amount
- status
- remarks

### 11. Risks

Must include:

- risk register
- activity-linked risk
- owner
- probability
- impact
- severity
- target date
- status

### 12. Dashboard

Must include:

- summary metrics
- project overview
- risk spotlight
- cost trend chart
- milestone pulse chart

### 13. Reports

Must include:

- reporting page
- printable/export-oriented output
- approved data as primary reporting source

### 14. Gantt / planning view

Must include:

- schedule visualization
- WBS + activity timeline
- milestone overlay

### 15. AI-assisted record creation

Must include:

- frontend agent panel
- backend proxy endpoint at `/api/agent/chat`
- Python FastAPI service receiving and processing agent calls
- agent able to create linked PMS records from natural language

---

## Domain Rules That Must Not Break

These are project-defining rules and should be enforced in any recreated version.

- `project_code` must be unique.
- `wbs_code` must be unique within a project.
- `activity_code` must be unique within a project.
- an activity cannot exist without both a project and WBS
- dependencies must stay within the same project
- budgeting is entered at activity level
- allocation must not exceed budget unless an explicit override path exists
- material requests must reference a valid activity
- material receipts must not exceed approved pending quantity unless override logic is explicitly designed
- timesheets must enforce daily-hour validation and duplicate/overlap safeguards
- approved transactional data should drive dashboards and reports
- risk severity is `probability * impact`
- auditability matters for create, update, delete, approve, override, submit, certify, and post actions

If a requested change conflicts with these rules, stop and make the tradeoff explicit.

---

## Data Model Expectations

Use MySQL as the primary runtime database.

### Schema expectations

Design the schema with strong linkage around:

- `project_id`
- `wbs_id`
- `activity_id`
- document/reference numbers
- dates
- statuses

Use:

- foreign keys
- indexes
- versioned Flyway migrations

Do not rely on JPA auto-create behavior as the main schema strategy.

### Auth/account expectations

Current system supports:

- users
- roles via `roleName`
- active/inactive state
- email verification state
- password reset codes
- avatar image storage as image data URL text

Recreated project should support equivalent account capabilities.

---

## API Design Expectations

The backend is REST-first.

When reproducing the project, keep:

- predictable resource naming
- JSON DTO contracts
- validation annotations on request DTOs
- business validation in services
- Spring Security protection
- usable OpenAPI docs

### Important API families

The current frontend/backend shape implies API groups like:

- `/api/auth/*`
- `/api/account/*`
- `/api/users/*`
- `/api/projects/*`
- `/api/wbs/*`
- `/api/activities/*`
- `/api/milestones/*`
- `/api/employee-allocations/*`
- `/api/timesheets/*`
- `/api/material-requests/*`
- `/api/billing/*`
- `/api/risks/*`
- `/api/dashboard/*`
- `/api/agent/chat`

The exact implementation may vary slightly, but recreated projects should preserve this overall REST structure.

---

## Workflow Expectations

This is not a toy CRUD app. Build transactional modules with workflow states.

Typical flows:

- `Draft -> Submitted -> Approved -> Posted`
- `Draft -> Submitted -> Approved -> Partially Received -> Fully Received`
- planning state progressions for activities and milestones

Recreated versions should support status-driven operations, not just unconstrained CRUD.

---

## Frontend Behavior Expectations

### App shell

Authenticated screens should use a consistent shell with:

- top bar
- navigation menu
- page wrapper
- floating button for agent access
- sidebar/drawer patterns for editing

### Forms

Forms should:

- use React Hook Form + Zod
- show field-level errors
- support create and edit flows
- preserve existing domain labels

### State

Zustand is used for lightweight shared state such as:

- auth token
- refresh token
- hydration state
- current user profile
- selected project

Do not replace this with Redux unless explicitly asked.

### Theme

Preserve:

- theme tokens in global CSS
- data-theme switching
- color customization
- accessible contrast

---

## Backend Behavior Expectations

### Security

Preserve:

- JWT authentication
- refresh token support
- Spring Security-based endpoint protection
- account-scoped profile actions
- admin-style user management

### Validation

Preserve both:

- DTO validation
- service-level business validation

### Mapping

MapStruct is part of the intended stack. Use it where mapping complexity grows, especially in DTO/entity transitions.

---

## Agent Service Expectations

The Python service is a separate boundary and should stay that way.

Current intent:

- FastAPI endpoint(s)
- backend proxies requests to it
- creates PMS records through structured backend contracts

If changing backend agent payloads:

- update Python service contract too

Avoid turning the agent service into a frontend-only mock.

---

## Environment And Runtime

### Local ports

Expected local runtime:

- frontend: `http://localhost:3000`
- backend: `http://localhost:8080`
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- MySQL via Docker: `localhost:3307`

### Environment/config

Backend local runtime expects:

- `backend/.env.properties`

Compose setup should provide:

- MySQL database
- backend DB connection
- agent-python service URL
- frontend API base URL

### Typical commands

Recreated project should support equivalent workflows:

```bash
cd frontend && npm run dev
cd backend && ./mvnw spring-boot:run
docker compose up --build
```

---

## Testing And Verification Expectations

Before completing meaningful work:

- run `npm run lint` in `frontend/` for frontend changes when feasible
- run relevant backend tests or at least a backend package/build verification when feasible
- call out anything not verified

Recommended test focus:

- hierarchy validation
- amount and quantity rollups
- workflow transitions
- auth and permission-sensitive behavior
- timesheet validation
- posting/report correctness

---

## Delivery Priorities

If an agent needs to decide what to build first in a recreated version, use this order:

1. Authentication, roles, permissions
2. Projects
3. WBS, milestones, activities
4. Budgeting and allocation
5. Material flow
6. Timesheets and employee allocation
7. Billing and actuals
8. Risk management
9. Dashboard and reports
10. Agent-assisted creation and polish

Prioritize working end-to-end flows over decorative UI.

---

## Good Changes In This Repo

Good changes usually:

- strengthen the `Project -> WBS -> Activity` model
- improve real workflow support
- keep modules cohesive
- replace placeholder data with API-backed behavior
- improve validation, auditability, and reporting accuracy
- preserve enterprise UX consistency

Risky changes usually:

- bypass workflow status logic
- duplicate models across layers
- weaken module boundaries
- add schema changes without Flyway
- store logic in the wrong module
- hardcode values that belong in data or configuration

---

## Reproduction Goal

If you use this file to generate a new project, the output should resemble this repository in all major dimensions:

- same domain
- same stack
- same modular boundaries
- same primary routes
- same data hierarchy
- same transactional workflows
- same enterprise UI shell
- same AI-assisted side-panel concept
- same Dockerized local developer experience

Do not produce a generic CRUD starter.

Produce a **project-controls application** with concrete modules, business rules, auth flows, planning surfaces, transactional screens, reporting, and an integrated agent workflow like this repository.
