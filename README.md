# Project Management and Cost Control System

This repository now contains a full-stack starter for the application described in [AGENTS.md](/Users/sibi/Workspaces/projects/projectmanagement/AGENTS.md):

- `frontend/`: Next.js 16 + TypeScript + Tailwind CSS 4 + Zustand + React Hook Form + Zod + Recharts
- `backend/`: Spring Boot 3.3 + Spring Security + Spring Data JPA + Flyway + OpenAPI

## What is implemented

- enterprise-style frontend shell with routes for dashboard, projects, WBS, activities, budgets, material requests, risks, reports, and login
- reusable frontend components for layout, cards, tables, charts, and forms
- typed sample data aligned to the `Project -> WBS -> Activity` hierarchy
- backend modular monolith starter packages for dashboard, project, WBS, activity, and risk
- REST endpoints for summary, project listing/creation, WBS listing, activity listing, and risk listing
- Flyway baseline schema for core planning tables
- local MySQL runtime configuration with Flyway-managed schema migrations

## Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

## Local MySQL setup

The backend expects MySQL to run locally.

Default local runtime values:

- database: `projectmanagement`
- host: `localhost:3306`
- username: `root` unless `DB_USERNAME` is set
- password: empty unless `DB_PASSWORD` is set

If you want a dedicated local app user, run:

```bash
mysql -u root -p < backend/scripts/mysql/init.sql
```

That script creates:

- database: `projectmanagement`
- user: `pms_user`
- password: `pms_password`

## Backend environment file

Create `backend/.env.properties` with the values you want to run locally, for example:

```properties
DB_URL=jdbc:mysql://localhost:3306/projectmanagement?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Kolkata
DB_USERNAME=pms_user
DB_PASSWORD=pms_password
JWT_SECRET=change-this-secret-before-sharing
MAIL_FROM=support@example.com
SPRING_MAIL_HOST=smtp.office365.com
SPRING_MAIL_PORT=587
SPRING_MAIL_USERNAME=support@example.com
SPRING_MAIL_PASSWORD=change-this-mail-password
```

The backend loads `backend/.env.properties` automatically.

## Run the backend

```bash
cd backend
./mvnw spring-boot:run
```

Open `http://localhost:8080/swagger-ui.html` for the API docs.

## Suggested next steps

1. Replace mock frontend data with calls to the backend API client in `frontend/src/lib/api.ts`.
2. Add auth, roles, permissions, and JWT flow.
3. Expand the backend from starter services into real repositories, mappers, validators, and transactional flows for budgeting, material, timesheets, and actual cost posting.
