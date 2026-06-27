# GrowthPath

Production-ready MERN-style TypeScript monorepo scaffold for GrowthPath.

## Stack

- **API**: Express, MongoDB (Mongoose), RabbitMQ publisher, MinIO/S3
- **Worker**: RabbitMQ consumer, node-cron placeholder
- **UI**: React + Vite SPA, Nginx + Certbot in production
- **Infra**: Docker Compose for local MongoDB, RabbitMQ, and MinIO

## Quickstart

```bash
cp .env.example .env
npm install
npm run docker:up
npm run seed
npm run dev:apps
```

Open:

- UI: http://localhost:5173
- API health: http://localhost:3001/health
- RabbitMQ management: http://localhost:15674 (credentials in `.env`: `RABBITMQ_USER` / `RABBITMQ_PASSWORD`)
- MinIO console: http://localhost:9005 (credentials in `.env`: `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY`)

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start local infra + all apps |
| `npm run dev:apps` | Run api, ui, worker on host |
| `npm run build` | Build all workspaces |
| `npm test` | Run Vitest suite |
| `npm run lint` | ESLint across repo |
| `npm run docker:up` | Start local MongoDB, RabbitMQ, MinIO |
| `npm run generate:secrets` | Print generated production secrets |
| `npm run seed` | Seed local admin user |
| `npm run build:prod` | Build production Docker images |
| `npm run deploy:prod` | Deploy production compose stack |

## Project values

- `APP_NAME`: growthpath
- `PACKAGE_SCOPE`: @growthpath
- `DEFAULT_DOMAIN`: growthpath.example.com
- `IMAGE_NAMESPACE`: growthpath

## Documentation

- [Technical Architecture](docs/1.%20Technical%20Architecture.md)
- [Local Development](docs/2.%20Local%20Development.md)
- [Production Deployment](docs/3.%20Production%20Deployment.md)
- [Environment Variables](docs/4.%20Environment%20Variables.md)
- [Operations Runbook](docs/5.%20Operations%20Runbook.md)

## Default admin (local)

After `npm run seed`, sign in with credentials from `.env`:

- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`
