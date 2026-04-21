# Frontend

This frontend is a Next.js application for the Project Management and Cost Control System.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## API configuration

Create one of the local env files supported by Next.js if you need to override the backend URL.

Example:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api
```

## Notes

- The UI currently mixes live API calls with typed mock data while backend modules are being expanded.
- Local development assumes the backend runs on `http://localhost:8080`.
