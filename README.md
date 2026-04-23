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
OPENROUTER_API_KEY=replace-with-your-openrouter-api-key
OPENROUTER_MODEL=openai/gpt-oss-120b
```

The backend loads `backend/.env.properties` automatically.

## Run the backend

```bash
cd backend
./mvnw spring-boot:run
```

Open `http://localhost:8080/swagger-ui.html` for the API docs.

## Chatbot agent

The frontend now includes an `Agent` screen at `http://localhost:3000/agent`.

This agent can create live PMS data through the backend for:

- projects
- users
- WBS items
- milestones
- activities
- risks
- material requests
- employee allocations
- timesheets
- billings

Before using it, set these backend env values:

- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL` (default: `openai/gpt-oss-120b`)

The chat agent itself now runs as a separate Python FastAPI service. The Spring Boot backend keeps the same `POST /api/agent/chat` endpoint and proxies requests to the Python agent container.

Example prompt:

```text
Create project PRJ-2601 named South Plant Upgrade for Acme Manufacturing managed by Sibi Kumar starting 2026-05-01 and ending 2026-12-20 with budget 4500000. Add WBS 1.0 Engineering and WBS 2.0 Execution. Under WBS 2.0 create activity ACT-2601 Foundation Works from 2026-05-08 to 2026-05-28 for 20 days assigned to Sibi Kumar with status NOT_STARTED.
```

## Run with Docker

The repository now includes a full Docker setup for:

- `mysql` on `localhost:3307`
- `backend` on `http://localhost:8080`
- `agent-python` as an internal Python chat-agent service
- `frontend` on `http://localhost:3000`

Start everything:

```bash
docker compose up --build
```

Run in background:

```bash
docker compose up --build -d
```

Stop everything:

```bash
docker compose down
```

Stop and remove the database volume too:

```bash
docker compose down -v
```

Notes:

- The backend connects to MySQL through the Docker service name `mysql`.
- The backend forwards chatbot requests to the Python agent through `AGENT_PYTHON_URL=http://agent-python:8000`.
- The Python agent uses `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` from `backend/.env.properties`.
- MySQL is published on `localhost:3307` to avoid conflicts with an existing local MySQL on `3306`.
- The frontend is built with `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api` so the browser can reach the backend from your host machine.
- Update `JWT_SECRET` in [compose.yaml](/Users/sibi/Workspaces/projects/projectmanagement/compose.yaml) before sharing or deploying beyond local use.

## Suggested next steps

1. Replace mock frontend data with calls to the backend API client in `frontend/src/lib/api.ts`.
2. Add auth, roles, permissions, and JWT flow.
3. Expand the backend from starter services into real repositories, mappers, validators, and transactional flows for budgeting, material, timesheets, and actual cost posting.
