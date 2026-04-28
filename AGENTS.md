# AGENTS.md

## Purpose

This repository contains a full-stack **Project Management and Cost Control System** for managing:

- project setup
- WBS and activity planning
- budgeting and allocations
- material requests and receipts
- employee allocations and timesheets
- actual cost capture
- risk tracking
- dashboards, reports, and agent-assisted data entry

The core business hierarchy is the source of truth for nearly every module:

**Project -> WBS -> Activity**

Agents working in this repo should preserve that hierarchy in data models, APIs, UI flows, and validation logic.

---

## Current Stack

### Frontend

- Next.js 16 App Router
- TypeScript
- React 19
- Tailwind CSS 4
- Zustand
- React Hook Form
- Zod
- Recharts
- Axios

Frontend app lives in `frontend/`.

### Backend

- Spring Boot 3.3
- Java 17
- Spring Security
- Spring Data JPA
- Flyway
- MapStruct
- OpenAPI
- MySQL for primary runtime

Backend app lives in `backend/`.

### Agent Service

- Python FastAPI service in `agent-python/`
- Spring Boot proxies agent requests through `/api/agent/chat`

---

## Repository Map

- `frontend/`: web UI
- `backend/`: REST API, domain logic, persistence, auth, migrations
- `agent-python/`: LLM-powered assistant service for creating PMS records
- `scripts/`: helper scripts
- `.github/`: CI or support automation

Important frontend areas:

- `frontend/src/app/`: routes and pages
- `frontend/src/components/`: reusable UI
- `frontend/src/lib/`: API and shared utilities
- `frontend/src/store/`: Zustand state

Important backend areas:

- `backend/src/main/java/com/company/pms/`: domain modules
- `backend/src/main/resources/db/migration/`: Flyway migrations
- `backend/src/test/`: backend tests

Current backend modules include:

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
- `security`
- `timesheet`
- `wbs`

---

## Architectural Direction

Build and maintain this system as a **modular monolith**.

Prefer clean domain separation over premature microservices. Keep logic close to the owning module, but design boundaries so future extraction is still possible.

### Backend shape

Each business module should generally trend toward:

- controller
- service
- repository
- dto
- entity
- mapper
- validator or specification

Do not expose JPA entities directly from controllers.

### Frontend shape

Prefer this layering:

- route/page composition in `src/app`
- reusable business UI in `src/components`
- API calls in `src/lib` or dedicated service modules
- forms with React Hook Form + Zod
- lightweight client state in Zustand only where shared state is genuinely needed

---

## Domain Rules That Must Survive Refactors

These rules are business-critical:

- `project_code` must be unique.
- `wbs_code` must be unique within a project.
- `activity_code` must be unique within a project.
- An activity cannot exist without both a project and WBS.
- Dependencies must stay within the same project.
- Budgeting is entered at activity level.
- Allocation must not exceed budget unless an explicit override path exists.
- Material requests must reference a valid activity.
- Material receipts must not exceed approved pending quantity unless an override path exists.
- Timesheets must enforce daily-hour validation and duplicate/overlap safeguards.
- Approved transactional data is what should feed dashboards and reports.
- Risk severity is calculated as `probability * impact`.
- Auditability matters for create, update, delete, approve, post, and override actions.

If a requested change conflicts with these rules, pause and make that tradeoff explicit.

---

## Product Modules

The intended module set is:

1. Authentication and authorization
2. Master data
3. Projects
4. WBS
5. Milestones
6. Activities and dependencies
7. Budgeting
8. Resource allocation
9. Material requests
10. Material receipts
11. Employee allocations
12. Timesheets
13. Actual entries
14. Overhead allocation
15. Gantt and planning views
16. Risk management
17. Dashboard and reports
18. Agent-assisted record creation

When adding new features, map them into one of these modules instead of introducing ad hoc cross-cutting folders.

---

## Data and API Expectations

### Database

- MySQL is the primary target database.
- Flyway migrations are the canonical way to evolve schema.
- Keep foreign keys and indexes aligned with `project_id`, `wbs_id`, `activity_id`, document/reference numbers, dates, and statuses.

### APIs

- REST-first design
- predictable resource naming
- validation in both request DTOs and service-layer business logic
- secure endpoints with Spring Security
- OpenAPI docs should remain usable after API changes

### Audit and approval

For transactional modules, design with status transitions in mind, not just CRUD.

Typical examples:

- Draft -> Submitted -> Approved -> Posted
- Draft -> Submitted -> Approved -> Partially Received -> Fully Received

---

## Working Conventions For Agents

### General

- Make changes that fit the existing stack instead of introducing parallel patterns.
- Prefer incremental work over speculative abstraction.
- Preserve existing domain language: project, WBS, activity, budget, allocation, receipt, timesheet, actual, risk, billing.
- Keep user-facing labels aligned with construction/project-controls terminology.

### Frontend

- Check `frontend/AGENTS.md` before changing Next.js code.
- Respect App Router conventions.
- Prefer server-safe patterns and avoid unnecessary client components.
- Reuse existing shared components before creating new ones.
- Keep tables, cards, dashboards, and forms consistent with the current enterprise UI style.
- When building forms, validate with Zod and surface useful field errors.

### Backend

- Put business rules in services and validators, not just controllers.
- Use DTOs for request and response payloads.
- Keep transactional operations explicit.
- Update Flyway migrations for schema changes; do not rely on JPA auto-create behavior.
- Maintain clear module ownership. If logic belongs to `material`, do not bury it in unrelated packages.

### Python agent service

- Treat `agent-python/` as a separate service boundary.
- Keep prompts, tool wiring, and backend contracts stable.
- If you change the Spring endpoint contract, update the Python agent accordingly.

---

## Delivery Priorities

When deciding what to build next, prefer this sequence unless the user says otherwise:

1. Authentication, roles, permissions
2. Master data
3. Projects
4. WBS, milestones, activities, dependencies
5. Budgeting and allocation
6. Material flow
7. Employee allocation and timesheets
8. Actuals and overhead allocation
9. Risk management
10. Dashboard, reports, exports, and polishing

If asked to extend unfinished modules, prioritize working end-to-end flows over decorative UI.

---

## Local Run Expectations

Typical local commands:

```bash
cd frontend && npm run dev
cd backend && ./mvnw spring-boot:run
docker compose up --build
```

Backend local runtime expects MySQL configuration through `backend/.env.properties`.

Important runtime notes:

- frontend default host: `http://localhost:3000`
- backend default host: `http://localhost:8080`
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- Docker MySQL is exposed on `localhost:3307`

---

## Testing Expectations

Before finishing meaningful code changes:

- run `npm run lint` in `frontend/` for frontend edits when feasible
- run backend tests relevant to the changed module when feasible
- call out anything you could not verify

For business logic, favor tests around:

- hierarchy validation
- quantity and amount rollups
- workflow transitions
- permission-sensitive operations
- posting and actual-cost generation

---

## Good Changes In This Repo

Good changes usually:

- strengthen the `Project -> WBS -> Activity` model
- improve real workflow support instead of adding placeholder CRUD
- keep backend modules cohesive
- replace mock data with API-backed flows
- improve validation, auditability, and reporting correctness

Risky changes usually:

- bypass workflow statuses
- duplicate domain models across layers
- break module boundaries
- add schema changes without migrations
- hardcode values that should come from master data

---

## If You Need To Make Product Decisions

Default to these choices unless repo context clearly points elsewhere:

- Zustand over Redux for lightweight shared frontend state
- Zod for frontend validation
- Spring Data JPA + Flyway for persistence work
- REST endpoints over GraphQL
- modular monolith over service splitting
- enterprise clarity over flashy UI patterns

When in doubt, optimize for correctness, traceability, and maintainability in project-controls workflows.
