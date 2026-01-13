# LMA Nexus - Backend Implementation Plan

## Overview

This document provides a comprehensive plan for implementing the backend API server for LMA Nexus, replacing the current mock service layer with a production-ready Node.js backend.

---

## Technology Stack

| Component | Technology | Description |
|-----------|------------|-------------|
| **Runtime** | Node.js 20 LTS | JavaScript runtime |
| **Framework** | Express.js | Web framework |
| **Language** | TypeScript | Type-safe JavaScript |
| **ORM** | Prisma | Type-safe database client |
| **Database** | Neon PostgreSQL | Serverless PostgreSQL |
| **Auth** | JWT + bcrypt | Token-based authentication |
| **Validation** | Zod | Runtime schema validation |
| **Testing** | Jest + Supertest | Unit + Integration tests |

### Key Dependencies
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "@prisma/client": "^5.x",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.0",
    "zod": "^3.22.0",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "morgan": "^1.10.0",
    "dotenv": "^16.3.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "prisma": "^5.x",
    "@types/express": "^4.17.21",
    "@types/node": "^20.x",
    "tsx": "^4.x",
    "nodemon": "^3.0.0"
  }
}
```

---

## Architecture

### Layered Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      API Layer (Routes)                      │
│   /api/v1/auth, /api/v1/workspaces, /api/v1/drafts, etc.   │
├─────────────────────────────────────────────────────────────┤
│                    Controller Layer                          │
│        Request validation, response formatting               │
├─────────────────────────────────────────────────────────────┤
│                     Service Layer                            │
│         Business logic, cross-cutting concerns               │
├─────────────────────────────────────────────────────────────┤
│                   Repository Layer (Prisma)                  │
│              Database operations via Prisma Client           │
├─────────────────────────────────────────────────────────────┤
│                   Neon PostgreSQL                            │
│              Serverless database (with pooling)              │
└─────────────────────────────────────────────────────────────┘
```

### Project Structure

```
backend/
├── src/
│   ├── index.ts                 # Application entry point
│   ├── app.ts                   # Express app setup
│   ├── config/
│   │   ├── index.ts             # Environment config
│   │   ├── database.ts          # DB connection config
│   │   └── auth.ts              # JWT/Auth config
│   ├── routes/
│   │   ├── index.ts             # Route aggregator
│   │   ├── auth.routes.ts       # /api/v1/auth/*
│   │   ├── workspace.routes.ts  # /api/v1/workspaces/*
│   │   ├── draft.routes.ts      # /api/v1/drafts/*
│   │   ├── graph.routes.ts      # /api/v1/graph/*
│   │   ├── drift.routes.ts      # /api/v1/drift/*
│   │   ├── recon.routes.ts      # /api/v1/reconciliation/*
│   │   ├── golden.routes.ts     # /api/v1/golden-record/*
│   │   └── audit.routes.ts      # /api/v1/audit/*
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── workspace.controller.ts
│   │   ├── draft.controller.ts
│   │   ├── graph.controller.ts
│   │   ├── drift.controller.ts
│   │   ├── recon.controller.ts
│   │   ├── golden.controller.ts
│   │   └── audit.controller.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── workspace.service.ts
│   │   ├── draft.service.ts
│   │   ├── graph.service.ts
│   │   ├── drift.service.ts
│   │   ├── recon.service.ts
│   │   ├── golden.service.ts
│   │   └── audit.service.ts
│   ├── repositories/
│   │   ├── user.repository.ts
│   │   ├── workspace.repository.ts
│   │   ├── clause.repository.ts
│   │   ├── variable.repository.ts
│   │   ├── graph.repository.ts
│   │   ├── drift.repository.ts
│   │   ├── recon.repository.ts
│   │   ├── golden.repository.ts
│   │   └── audit.repository.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts       # JWT verification
│   │   ├── workspace.middleware.ts  # Workspace access check
│   │   ├── permission.middleware.ts # RBAC enforcement
│   │   ├── error.middleware.ts      # Global error handler
│   │   ├── logging.middleware.ts    # Request logging
│   │   └── rateLimit.middleware.ts  # Rate limiting
│   ├── validators/
│   │   ├── auth.validator.ts
│   │   ├── workspace.validator.ts
│   │   ├── draft.validator.ts
│   │   └── ... (one per domain)
│   ├── types/
│   │   ├── index.ts                 # Shared types
│   │   ├── express.d.ts             # Express type extensions
│   │   └── api.types.ts             # API request/response types
│   ├── utils/
│   │   ├── errors.ts                # Custom error classes
│   │   ├── password.ts              # bcrypt helpers
│   │   ├── jwt.ts                   # JWT helpers
│   │   ├── permissions.ts           # RBAC logic (from frontend)
│   │   └── financialPatterns.ts     # Pattern detection (from frontend)
│   └── prisma/
│       ├── schema.prisma            # Prisma schema
│       ├── migrations/              # Database migrations
│       └── seed.ts                  # Seed data script
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── package.json
├── tsconfig.json
├── .env.example
├── Dockerfile
└── docker-compose.yml
```

---

## API Endpoints

### Authentication (`/api/v1/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/login` | Authenticate user | No |
| POST | `/logout` | Invalidate session | Yes |
| POST | `/refresh` | Refresh access token | Yes (refresh token) |
| GET | `/me` | Get current user | Yes |

**POST /login**
```typescript
// Request
{ email: string; password: string }

// Response 200
{
  accessToken: string;
  refreshToken: string;
  user: { id, email, name, avatarUrl };
  expiresIn: number;
}
```

---

### Workspaces (`/api/v1/workspaces`)

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/` | List user's workspaces | authenticated |
| POST | `/` | Create workspace | workspace:create |
| GET | `/:id` | Get workspace details | workspace member |
| PATCH | `/:id` | Update workspace | workspace:admin |
| GET | `/:id/members` | List members | workspace member |
| POST | `/:id/members` | Invite member | workspace:invite |
| PATCH | `/:id/members/:memberId` | Change role | workspace:changeRole |
| DELETE | `/:id/members/:memberId` | Remove member | workspace:removeMember |
| PATCH | `/:id/governance` | Update governance rules | workspace:admin |

**POST /** (Create Workspace)
```typescript
// Request
{
  name: string;
  currency: 'USD' | 'EUR' | 'GBP';
  amount: number;
  standard: string;
  basePdfName?: string;
}

// Response 201
{
  workspace: Workspace;
  membership: WorkspaceMember;
}
```

---

### Drafting (`/api/v1/workspaces/:workspaceId/drafts`)

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/outline` | Get document outline | workspace member |
| GET | `/clauses/:clauseId` | Get clause details | workspace member |
| PATCH | `/clauses/:clauseId` | Update clause text | draft:editText |
| POST | `/clauses/:clauseId/lock` | Lock clause | draft:lockSection |
| DELETE | `/clauses/:clauseId/lock` | Unlock clause | draft:lockSection |
| GET | `/clauses/:clauseId/variables` | Get clause variables | workspace member |
| POST | `/variables` | Bind new variable | variable:bind |
| PATCH | `/variables/:variableId` | Update variable | variable:edit |
| POST | `/sync` | Sync to graph | graph:sync |

**PATCH /clauses/:clauseId**
```typescript
// Request
{
  body: string;
  reason?: string;        // Required for sensitive clauses
  reasonCategory?: ReasonCategory;
}

// Response 200
{ clause: Clause }
```

---

### Graph (`/api/v1/workspaces/:workspaceId/graph`)

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/` | Get full graph state | graph:view |
| POST | `/recompute` | Recompute graph | graph:sync |
| GET | `/nodes/:nodeId/locate` | Get clause/variable for node | graph:view |

**GET /**
```typescript
// Response 200
{
  nodes: GraphNode[];
  edges: GraphEdge[];
  integrityScore: number;
  lastComputedAt: string;
}
```

---

### Drift (`/api/v1/workspaces/:workspaceId/drift`)

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/` | List drift items | drift:view |
| GET | `/:driftId` | Get drift details | drift:viewFull |
| POST | `/:driftId/override` | Override baseline | drift:overrideBaseline |
| POST | `/:driftId/revert` | Revert to baseline | drift:revertDraft |
| POST | `/:driftId/approve` | Approve drift | drift:approve |

**POST /:driftId/override**
```typescript
// Request
{
  reason: string;
  reasonCategory?: ReasonCategory;
}

// Response 200
{ drift: DriftItem }
```

---

### Reconciliation (`/api/v1/workspaces/:workspaceId/reconciliation`)

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/sessions` | List recon sessions | workspace member |
| POST | `/upload` | Upload markup file | recon:upload |
| GET | `/sessions/:sessionId/items` | Get session items | workspace member |
| POST | `/items/:itemId/apply` | Apply suggestion | recon:applyReject |
| POST | `/items/:itemId/reject` | Reject suggestion | recon:applyReject |

**POST /upload**
```typescript
// Request (multipart/form-data)
file: File (docx or pdf)

// Response 201
{
  session: ReconciliationSession;
  items: ReconciliationItem[];
}
```

---

### Golden Record (`/api/v1/workspaces/:workspaceId/golden-record`)

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/` | Get golden record | workspace member |
| GET | `/can-publish` | Check publish eligibility | workspace member |
| POST | `/export` | Export JSON schema | golden:export |
| POST | `/publish` | Publish to connectors | golden:publish |
| GET | `/connectors` | List connectors | workspace member |
| POST | `/connectors/:connectorId/test` | Test connection | golden:publish |

**POST /publish**
```typescript
// Request
{
  reason: string;
  reasonCategory?: ReasonCategory;
}

// Response 200
{ goldenRecord: GoldenRecord }
```

---

### Audit (`/api/v1/workspaces/:workspaceId/audit`)

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/` | List audit events | audit:viewLimited or audit:viewFull |
| GET | `/export` | Export audit log | audit:export |

**GET /**
```typescript
// Query params
?eventType=CLAUSE_EDIT
&actorId=user-001
&startDate=2024-01-01
&endDate=2024-12-31
&keyword=margin

// Response 200
{
  events: AuditEvent[];
  total: number;
  page: number;
  pageSize: number;
}
```

---

## Authentication & Authorization

### JWT Token Strategy

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│  Login API  │────▶│  Database   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │
       │                   ▼
       │           ┌─────────────────────────────┐
       │           │ Generate Tokens:            │
       │           │ - Access Token (15min)      │
       │           │ - Refresh Token (7 days)    │
       │           └─────────────────────────────┘
       │                   │
       ▼                   ▼
┌─────────────┐     ┌─────────────┐
│ Store tokens│◀────│  Response   │
│ (memory/    │     │             │
│  httpOnly)  │     └─────────────┘
└─────────────┘
```

### Access Token Payload
```typescript
{
  sub: string;      // User ID
  email: string;
  name: string;
  iat: number;      // Issued at
  exp: number;      // Expires at
}
```

### Middleware Flow
```
Request → Auth Middleware → Workspace Middleware → Permission Middleware → Controller
              │                    │                       │
              ▼                    ▼                       ▼
         Verify JWT          Check membership        Check permission
         Attach user         Attach workspace         Allow/Deny
```

### Permission Middleware Example
```typescript
// middleware/permission.middleware.ts
export function requirePermission(permission: Permission) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { user, membership } = req;
    
    if (!membership) {
      return res.status(403).json({ error: 'Not a workspace member' });
    }
    
    const permissions = getPermissionsForRole(membership.role);
    
    if (!permissions.includes(permission)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
}

// Usage in routes
router.patch(
  '/clauses/:clauseId',
  authMiddleware,
  workspaceMiddleware,
  requirePermission('draft:editText'),
  draftController.updateClause
);
```

---

## Error Handling

### Custom Error Classes
```typescript
// utils/errors.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(400, 'VALIDATION_ERROR', message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, 'FORBIDDEN', message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, 'NOT_FOUND', `${resource} not found`);
  }
}
```

### Error Response Format
```typescript
// All error responses follow this format
{
  success: false,
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  }
}
```

### Global Error Handler
```typescript
// middleware/error.middleware.ts
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log error
  console.error(err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Handle specific Prisma errors
  }

  // Unknown errors
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
}
```

---

## Audit Trail Implementation

### Automatic Audit Logging
```typescript
// services/audit.service.ts
export async function logAuditEvent(input: {
  workspaceId: string | null;
  actorId: string;
  actorName: string;
  eventType: AuditEventType;
  targetType?: string;
  targetId?: string;
  beforeState?: any;
  afterState?: any;
  reason?: string;
  reasonCategory?: ReasonCategory;
}) {
  // Audit events are IMMUTABLE - insert only
  await prisma.auditEvent.create({
    data: {
      id: uuidv4(),
      ...input,
      beforeState: input.beforeState ? JSON.stringify(input.beforeState) : null,
      afterState: input.afterState ? JSON.stringify(input.afterState) : null,
      timestamp: new Date(),
    },
  });
}
```

### Audit Trigger Pattern
```typescript
// Example: Clause update with automatic audit
async function updateClause(
  clauseId: string,
  newBody: string,
  actor: { id: string; name: string },
  reason?: string,
  reasonCategory?: ReasonCategory
) {
  const clause = await prisma.clause.findUnique({ where: { id: clauseId } });
  
  if (!clause) throw new NotFoundError('Clause');
  
  // Require reason for sensitive clauses
  if (clause.isSensitive && !reason) {
    throw new ValidationError('Reason required for sensitive clause edits');
  }
  
  const updatedClause = await prisma.clause.update({
    where: { id: clauseId },
    data: {
      body: newBody,
      lastModifiedAt: new Date(),
      lastModifiedBy: actor.id,
    },
  });
  
  // Log audit event
  await logAuditEvent({
    workspaceId: clause.workspaceId,
    actorId: actor.id,
    actorName: actor.name,
    eventType: 'CLAUSE_EDIT',
    targetType: 'clause',
    targetId: clauseId,
    beforeState: { body: clause.body },
    afterState: { body: newBody },
    reason,
    reasonCategory,
  });
  
  return updatedClause;
}
```

---

## Integration Points

### Frontend Integration

Update frontend services to call real API:
```typescript
// services/api.ts
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('accessToken');
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Request failed');
  }
  
  return response.json();
}

// Example service replacement
export async function login(email: string, password: string) {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}
```

### External Connector Webhooks
For publishing to downstream systems:
```typescript
// services/connector.service.ts
export async function publishToConnector(
  connector: DownstreamConnector,
  goldenRecord: GoldenRecord
) {
  switch (connector.type) {
    case 'LoanIQ':
      return publishToLoanIQ(connector.config, goldenRecord);
    case 'Finastra':
      return publishToFinastra(connector.config, goldenRecord);
    case 'Allvue':
      return publishToAllvue(connector.config, goldenRecord);
    default:
      throw new Error(`Unknown connector type: ${connector.type}`);
  }
}
```

---

## Deployment

### Environment Variables
```env
# .env.example
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/lma_nexus
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
```

### Docker Setup
```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist
COPY prisma ./prisma

RUN npx prisma generate

EXPOSE 3001

CMD ["node", "dist/index.js"]
```

```yaml
# docker-compose.yml (for local development only)
# Production uses Neon PostgreSQL (no local DB needed)
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=${DATABASE_URL}  # Use Neon connection string
      - JWT_SECRET=${JWT_SECRET}
    env_file:
      - .env
```

### Deployment Options

**Option 1: Vercel (Recommended for simplicity)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Option 2: Railway**
```bash
# Connect to Railway
railway login
railway init
railway up
```

**Option 3: Render / Fly.io**
- Both support Node.js apps with automatic deployments from GitHub

---

## Implementation Timeline

### Phase 1: Foundation (Week 1)
- [x] Project setup (Express, TypeScript, Prisma)
- [ ] Connect to Neon PostgreSQL
- [ ] Database schema migration
- [ ] Auth endpoints (login, logout, refresh, me)
- [ ] Basic middleware (auth, error handling, logging)

### Phase 2: Core Features (Week 2-3)
- [ ] Workspace CRUD endpoints
- [ ] Member management endpoints
- [ ] Drafting endpoints (clause, variable CRUD)
- [ ] Permission middleware integration
- [ ] Integration tests

### Phase 3: Advanced Features (Week 4-5)
- [ ] Graph computation service
- [ ] Drift detection service
- [ ] Reconciliation upload + AI stub
- [ ] Golden record export/publish
- [ ] Audit logging throughout

### Phase 4: Integration (Week 6)
- [ ] Frontend API integration
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Deployment to production

---

## Testing Strategy

### Unit Tests
- Test individual service functions
- Mock Prisma client
- Test permission logic
- Test validation schemas

### Integration Tests
- Test API endpoints with real database
- Test auth flows
- Test workspace isolation
- Test cross-service interactions

### E2E Tests
- Full user flows (login → workspace → draft → publish)
- Test with Cypress or Playwright

---

## Monitoring & Observability

### Logging
```typescript
// Use structured logging
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: { colorize: true },
  },
});
```

### Health Check Endpoint
```typescript
router.get('/health', async (req, res) => {
  const dbHealthy = await checkDatabaseConnection();
  
  res.status(dbHealthy ? 200 : 503).json({
    status: dbHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});
```

### Metrics (Optional)
- Request latency
- Error rates
- Active connections
- Database query times
