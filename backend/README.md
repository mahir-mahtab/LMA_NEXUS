# LMA Nexus Backend

Backend API server for LMA Nexus - Loan Documentation Management Platform.

## Setup after cloning

### Prerequisites

- Node.js 20+ (LTS preferred).
- pnpm 9+ (or npm 10+ if you prefer). pnpm is recommended because the repo ships a pnpm lockfile.
- Neon PostgreSQL account (or another Postgres server) with SSL-enabled connection string.
- An `.env` copy of `.env.example` that points to your database, auth secret, and CORS origins.

### Quick start

1. `cd backend`
2. `pnpm install` (or `npm install`).
3. `cp .env.example .env` and fill in your Neon `DATABASE_URL`, JWT secrets, and CORS origins.
4. `pnpm db:generate && pnpm db:migrate` to bootstrap Prisma.
5. `pnpm dev` to run the API in watch mode on `PORT` (defaults to `3001`).

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: Neon PostgreSQL (Serverless)
- **ORM**: Prisma
- **Authentication**: JWT + bcrypt
- **Validation**: Zod

## Getting Started

### Step 1: Install dependencies

1. `cd backend`
2. `pnpm install`
   - If you prefer npm, run `npm install` and then substitute `pnpm` with `npm run` in the commands below.

### Step 2: Configure the runtime

- `cp .env.example .env` and provide your Neon `DATABASE_URL`, JWT secrets, and CORS origins.
- Use a branch-specific Neon URL (for example, `ep-branch-neon.tech`) to isolate local data.
- Keep `LOG_LEVEL` low when debugging (`debug`), and bump to `info`/`warn` before deploying.

### Step 3: Prepare the database

- `pnpm db:generate` to refresh the Prisma client whenever you touch the schema.
- `pnpm db:migrate dev --name initial` to apply the schema and record a migration locally.
- `pnpm db:seed` to populate mock data defined in `prisma/seed.ts`.

### Step 4: Run the API locally

- `pnpm dev` (aliases to `tsx watch src/index.ts`) for hot reload during development.
- `pnpm dev:nodemon` restarts when the compiled output fails or TypeScript files change outside the watch scope.
- After verifying everything, `pnpm build` followed by `pnpm start` runs the compiled server from `dist`.

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Run the API with `tsx watch` for local development |
| `pnpm dev:nodemon` | Restart on file changes/errors via nodemon |
| `pnpm build` | TypeScript compilation for production deployments |
| `pnpm start` | Run the compiled `dist/index.js` file |
| `pnpm db:generate` | Regenerate the Prisma client |
| `pnpm db:push` | Push the Prisma schema without wrapping migrations |
| `pnpm db:migrate` | Apply/record local migrations (`dev` mode by default) |
| `pnpm db:migrate:prod` | Apply migrations in a production environment |
| `pnpm db:studio` | Launch Prisma Studio in the browser |
| `pnpm db:seed` | Seed the database via `prisma/seed.ts` |
| `pnpm lint` | Run ESLint on the `src` directory |
| `pnpm test` | Run Jest-powered tests |

## Environment Variables

Copy `.env.example` to `.env` and update the values below before running the server.

| Variable | Purpose | Default / Example |
|----------|---------|------------------|
| `DATABASE_URL` | Neon PostgreSQL connection string | `postgresql://...@ep-xxx.region.aws.neon.tech/lma_nexus?sslmode=require` |
| `JWT_SECRET` | Secret used to sign JWTs | Generate via `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `JWT_EXPIRES_IN` | Access token lifetime | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifetime | `7d` |
| `PORT` | HTTP port where the API listens | `3001` |
| `NODE_ENV` | Environment mode | `development` or `production` |
| `CORS_ORIGINS` | Allowed origins for clients | `http://localhost:3000,http://localhost:5173` |
| `RATE_LIMIT_WINDOW_MS` | Window size for rate limiting | `900000` |
| `RATE_LIMIT_MAX_REQUESTS` | Requests allowed per window | `100` |
| `LOG_LEVEL` | Logging verbosity for morgan/custom logger | `debug` (set to `info` in prod) |

## Project Structure

```
backend/
├── prisma/
│   └── schema.prisma      # Database schema
├── src/
│   ├── controllers/       # Route handlers
│   ├── middleware/        # Express middleware
│   ├── routes/            # API routes
│   ├── schemas/           # Zod validation schemas
│   ├── services/          # Business logic
│   ├── utils/             # Utility functions
│   ├── app.ts             # Express app setup
│   └── index.ts           # Entry point
├── .env.example           # Environment template
├── package.json
└── tsconfig.json
```

## API Endpoints

### Health Check
- `GET /health` - Server health status
- `GET /api/v1` - API info

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - User logout

### Users
- `GET /api/v1/users` - List users
- `GET /api/v1/users/:id` - Get user
- `PATCH /api/v1/users/:id` - Update user

### Workspaces
- `GET /api/v1/workspaces` - List workspaces
- `POST /api/v1/workspaces` - Create workspace
- `GET /api/v1/workspaces/:id` - Get workspace
- `PATCH /api/v1/workspaces/:id` - Update workspace
- `DELETE /api/v1/workspaces/:id` - Delete workspace

### Documents, Drifts, Drafts, etc.
*(See `docs/BACKEND.md` for complete API documentation)*

## Database

This project uses [Neon PostgreSQL](https://neon.tech), a serverless PostgreSQL platform.

### Neon Features Used
- **Serverless scaling**: Auto-scales to zero when idle
- **Branching**: Create database branches for development
- **Connection pooling**: Built-in connection pooling via `-pooler` endpoint

### Migrations

```bash
# Create a new migration
pnpm prisma migrate dev --name <migration_name>

# Apply migrations in production
pnpm prisma migrate deploy

# Reset database (DANGER: drops all data)
pnpm prisma migrate reset
```

## License

MIT
