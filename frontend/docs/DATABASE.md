# LMA Nexus - Database Implementation Plan

## Overview

This document outlines the database architecture for LMA Nexus, transitioning from the localStorage-based mock database to a production-ready PostgreSQL implementation using **Neon** as the serverless database provider.

---

## Technology Stack

| Component | Technology | Description |
|-----------|------------|-------------|
| **Database** | PostgreSQL 16 | Relational database |
| **Provider** | [Neon](https://neon.tech) | Serverless PostgreSQL |
| **ORM** | [Prisma](https://prisma.io) | Type-safe database client |

### Why Neon PostgreSQL?

**Neon** is a serverless PostgreSQL platform that offers:
- **Serverless Architecture**: Auto-scaling, pay-per-use pricing
- **Branching**: Create database branches for development/testing (like Git)
- **Connection Pooling**: Built-in PgBouncer for efficient connections
- **Instant Provisioning**: Databases ready in seconds
- **Free Tier**: Generous free tier for development (0.5 GB storage, 190 compute hours/month)
- **Auto-suspend**: Compute scales to zero when inactive

### Neon Connection Setup

```env
# .env
# Neon provides two connection strings:
DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/neon_db?sslmode=require"

# For Prisma with connection pooling (recommended for serverless)
DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/neon_db?sslmode=require&pgbouncer=true"

# Direct connection for migrations
DIRECT_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/neon_db?sslmode=require"
```

### Why PostgreSQL?
- **ACID Compliance**: Critical for financial loan documentation integrity
- **JSON/JSONB Support**: Native support for storing schema exports and complex nested data
- **Full-text Search**: Built-in for searching clause content and audit logs
- **Strong Consistency**: Required for audit trail immutability
- **Excellent TypeScript/Node.js Support**: via Prisma ORM
- **Scalability**: Handles complex queries and large datasets efficiently

---

## Data Model Architecture

### Entity Relationship Overview

```
┌─────────────┐       ┌─────────────────────┐       ┌─────────────┐
│   users     │───────│  workspace_members  │───────│  workspaces │
└─────────────┘       └─────────────────────┘       └─────────────┘
      │                                                    │
      │ sessions                                           │
      ▼                                                    ▼
┌─────────────┐                                   ┌─────────────────┐
│  sessions   │                                   │    clauses      │
└─────────────┘                                   └─────────────────┘
                                                          │
                                                          ▼
                                                  ┌─────────────────┐
                                                  │   variables     │
                                                  └─────────────────┘
                                                          │
                    ┌────────────────────────────────────┼────────────────────────────┐
                    ▼                                    ▼                            ▼
            ┌─────────────┐                      ┌─────────────┐              ┌─────────────┐
            │ graph_nodes │                      │ drift_items │              │  covenants  │
            └─────────────┘                      └─────────────┘              └─────────────┘
                    │
                    ▼
            ┌─────────────┐
            │ graph_edges │
            └─────────────┘

            ┌─────────────────────┐       ┌────────────────────────┐
            │ reconciliation_     │───────│  reconciliation_items  │
            │ sessions            │       └────────────────────────┘
            └─────────────────────┘

            ┌─────────────────────┐       ┌────────────────────────┐
            │  golden_records     │───────│  downstream_connectors │
            └─────────────────────┘       └────────────────────────┘

            ┌─────────────────────────────────────────────────────┐
            │                    audit_events                     │
            │           (immutable, append-only table)            │
            └─────────────────────────────────────────────────────┘
```

---

## Tables Design

### Core Identity Tables

#### 1. `users`
Stores user account information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CUID | PK, DEFAULT cuid() | Unique user identifier (using CUID) |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email (login) |
| name | VARCHAR(255) | NOT NULL | Display name |
| password | VARCHAR(255) | NOT NULL | bcrypt hashed password |
| avatar_url | TEXT | NULL | Profile picture URL |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Account creation time |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update time |

**Indexes:**
- `idx_users_email` - UNIQUE index on `email` for fast login lookups

---

#### 2. `sessions`
Active user sessions (JWT or session-based auth).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CUID | PK | Session token/ID |
| user_id | CUID | FK → users.id, NOT NULL, CASCADE | Session owner |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Session start |
| expires_at | TIMESTAMPTZ | NOT NULL | Session expiry |

**Indexes:**
- `idx_sessions_user_id` - Fast session lookup by user
- `idx_sessions_expires_at` - Cleanup expired sessions

---

### Workspace Tables

#### 3. `workspaces`
Loan deal workspaces (data isolation boundaries).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CUID | PK | Workspace identifier |
| name | VARCHAR(255) | NOT NULL | Deal name (e.g., "Project Atlas") |
| currency | VARCHAR(3) | NOT NULL, DEFAULT 'USD' | Deal currency (USD, EUR, GBP) |
| amount | FLOAT | NOT NULL, DEFAULT 0 | Facility amount |
| standard | VARCHAR(50) | NOT NULL, DEFAULT 'LMA' | LMA standard version |
| base_pdf_name | VARCHAR(255) | NULL | Original document name |
| created_by_id | CUID | FK → users.id, NOT NULL | Creator user |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| last_sync_at | TIMESTAMPTZ | DEFAULT NOW() | Last graph sync |
| governance_rules | JSON | NOT NULL, DEFAULT '{}' | Governance settings |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update time |

**Governance Rules JSONB Structure:**
```json
{
  "requireReasonForSensitiveEdits": true,
  "legalCanRevertDraft": false,
  "riskApprovalRequiredForOverride": false,
  "publishBlockedWhenHighDrift": true,
  "definitionsLockedAfterApproval": false,
  "externalCounselReadOnly": false
}
```

**Indexes:**
- `idx_workspaces_created_by` - List user's created workspaces

---

#### 4. `workspace_members`
Maps users to workspaces with roles.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CUID | PK | Membership identifier |
| workspace_id | CUID | FK → workspaces.id, NOT NULL, CASCADE | Target workspace |
| user_id | CUID | FK → users.id, NOT NULL, CASCADE | Member user |
| role | ENUM(Role) | NOT NULL, DEFAULT 'investor' | User role: agent, legal, risk, investor |
| is_admin | BOOLEAN | DEFAULT FALSE | Workspace admin flag |
| status | ENUM(MemberStatus) | DEFAULT 'pending' | Membership status: active, pending, removed |
| invited_at | TIMESTAMPTZ | DEFAULT NOW() | Invitation time |
| joined_at | TIMESTAMPTZ | NULL | Acceptance time |

**Indexes:**
- `idx_workspace_members_workspace_user` - UNIQUE(user_id, workspace_id) - One membership per user per workspace
- `idx_workspace_members_workspace_id` - List all members in workspace
- `idx_workspace_members_user_id` - List all workspaces for a user
- `idx_workspace_members_status` - Filter by status

---

### Document Tables

#### 5. `clauses`
Loan agreement clause content.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CUID | PK | Clause identifier |
| workspace_id | CUID | FK → workspaces.id, NOT NULL, CASCADE | Parent workspace |
| title | VARCHAR(255) | NOT NULL | Clause heading |
| body | TEXT | NOT NULL | Clause content (legal text) |
| type | ENUM(ClauseType) | NOT NULL | Clause type: financial, covenant, definition, xref, general |
| order | INTEGER | NOT NULL | Display order (renamed from order_index) |
| is_sensitive | BOOLEAN | DEFAULT FALSE | Requires reason for edits |
| is_locked | BOOLEAN | DEFAULT FALSE | Section lock status |
| locked_by | CUID | FK → users.id, NULL | Lock holder |
| locked_at | TIMESTAMPTZ | NULL | Lock acquisition time |
| last_modified_at | TIMESTAMPTZ | DEFAULT NOW() | Last edit time |
| last_modified_by | CUID | FK → users.id, NOT NULL | Last editor |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update time |

**Indexes:**
- `idx_clauses_workspace_order` - UNIQUE(workspace_id, order) for ordered retrieval
- `idx_clauses_workspace_id` - All clauses in workspace
- `idx_clauses_type` - Filter by clause type
- `idx_clauses_is_locked` - Find locked clauses

---

#### 6. `variables`
Bound financial variables extracted from clauses.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CUID | PK | Variable identifier |
| workspace_id | CUID | FK → workspaces.id, NOT NULL, CASCADE | Parent workspace |
| clause_id | CUID | FK → clauses.id, NOT NULL, CASCADE | Source clause |
| label | VARCHAR(255) | NOT NULL | Variable name |
| type | ENUM(VariableType) | NOT NULL | Variable type: financial, definition, covenant, ratio |
| value | TEXT | NOT NULL | Current value |
| unit | VARCHAR(50) | NULL | Unit (USD, bps, %, x) |
| baseline_value | TEXT | NULL | Approved baseline |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| last_modified_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |
| last_modified_by | CUID | FK → users.id, NULL | Last modifier |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update time |

**Indexes:**
- `idx_variables_workspace_id` - All variables for workspace
- `idx_variables_clause_id` - Variables bound to a clause
- `idx_variables_type` - Filter by variable type

---

### Graph Tables

#### 7. `graph_nodes`
Dependency graph visualization nodes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CUID | PK | Node identifier |
| workspace_id | CUID | FK → workspaces.id, NOT NULL, CASCADE | Parent workspace |
| label | VARCHAR(255) | NOT NULL | Display label |
| type | ENUM(NodeType) | NOT NULL | Node type: financial, covenant, definition, xref |
| clause_id | CUID | FK → clauses.id, NULL, SET NULL | Linked clause |
| variable_id | CUID | FK → variables.id, NULL, SET NULL | Linked variable |
| value | TEXT | NULL | Current value |
| has_drift | BOOLEAN | DEFAULT FALSE | Drift indicator |
| has_warning | BOOLEAN | DEFAULT FALSE | Warning indicator |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update time |

**Indexes:**
- `idx_graph_nodes_workspace_id` - All nodes for workspace
- `idx_graph_nodes_type` - Filter by node type
- `idx_graph_nodes_clause_id` - Nodes linked to clause
- `idx_graph_nodes_variable_id` - Nodes linked to variable

---

#### 8. `graph_edges`
Dependency relationships between nodes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CUID | PK | Edge identifier |
| workspace_id | CUID | FK → workspaces.id, NOT NULL, CASCADE | Parent workspace |
| source_id | CUID | FK → graph_nodes.id, NOT NULL, CASCADE | Source node |
| target_id | CUID | FK → graph_nodes.id, NOT NULL, CASCADE | Target node |
| weight | INTEGER | DEFAULT 1 | Relationship strength |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

**Constraints:**
- UNIQUE(workspace_id, source_id, target_id) - No duplicate edges

**Indexes:**
- `idx_graph_edges_workspace_id` - All edges for workspace
- `idx_graph_edges_source_id` - Outbound edges from node
- `idx_graph_edges_target_id` - Inbound edges to node

---

### Drift Tables

#### 9. `drift_items`
Commercial drift detection results.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CUID | PK | Drift item identifier |
| workspace_id | CUID | FK → workspaces.id, NOT NULL, CASCADE | Parent workspace |
| clause_id | CUID | FK → clauses.id, NOT NULL, CASCADE | Source clause |
| variable_id | CUID | FK → variables.id, NULL, SET NULL | Source variable |
| title | VARCHAR(255) | NOT NULL | Drift description |
| type | ENUM(ClauseType) | NOT NULL | Clause type |
| severity | ENUM(DriftSeverity) | NOT NULL | Drift severity: HIGH, MEDIUM, LOW |
| baseline_value | TEXT | NOT NULL | Approved baseline |
| baseline_approved_at | TIMESTAMPTZ | NOT NULL | Baseline approval time |
| current_value | TEXT | NOT NULL | Current value |
| current_modified_at | TIMESTAMPTZ | NOT NULL | Current value time |
| current_modified_by | CUID | FK → users.id, NOT NULL | Who made the change |
| status | ENUM(DriftStatus) | DEFAULT 'unresolved' | Status: unresolved, overridden, reverted, approved |
| approved_by | CUID | FK → users.id, NULL | Approver |
| approved_at | TIMESTAMPTZ | NULL | Approval time |
| approval_reason | TEXT | NULL | Approval justification |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update time |

**Indexes:**
- `idx_drift_items_workspace_id` - All drift items in workspace
- `idx_drift_items_clause_id` - Drift items for clause
- `idx_drift_items_variable_id` - Drift items for variable
- `idx_drift_items_severity` - Filter by severity
- `idx_drift_items_status` - Filter by status

---

### Reconciliation Tables

#### 10. `reconciliation_sessions`
AI markup analysis sessions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CUID | PK | Session identifier |
| workspace_id | CUID | FK → workspaces.id, NOT NULL, CASCADE | Parent workspace |
| file_name | VARCHAR(255) | NOT NULL | Uploaded file name |
| file_type | ENUM(ReconciliationFileType) | NOT NULL | File format: docx, pdf |
| uploaded_at | TIMESTAMPTZ | DEFAULT NOW() | Upload time |
| uploaded_by | CUID | FK → users.id, NOT NULL | Uploader |
| total_items | INTEGER | DEFAULT 0 | Total suggestions |
| applied_count | INTEGER | DEFAULT 0 | Applied count |
| rejected_count | INTEGER | DEFAULT 0 | Rejected count |
| pending_count | INTEGER | DEFAULT 0 | Pending count |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update time |

**Indexes:**
- `idx_reconciliation_sessions_workspace_id` - Sessions for workspace
- `idx_reconciliation_sessions_uploaded_by` - Sessions by uploader
- `idx_reconciliation_sessions_file_type` - Filter by file type

---

#### 11. `reconciliation_items`
Individual markup suggestions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CUID | PK | Item identifier |
| workspace_id | CUID | FK → workspaces.id, NOT NULL, CASCADE | Parent workspace |
| session_id | CUID | FK → reconciliation_sessions.id, NOT NULL, CASCADE | Parent session |
| incoming_snippet | TEXT | NOT NULL | Extracted markup text |
| target_clause_id | CUID | FK → clauses.id, NOT NULL, CASCADE | Target clause |
| target_variable_id | CUID | FK → variables.id, NULL, SET NULL | Target variable |
| confidence | ENUM(ConfidenceLevel) | NOT NULL | AI confidence: HIGH, MEDIUM, LOW |
| baseline_value | TEXT | NOT NULL | Original value |
| current_value | TEXT | NOT NULL | Current draft value |
| proposed_value | TEXT | NOT NULL | Suggested new value |
| decision | ENUM(ReconciliationDecision) | DEFAULT 'pending' | Decision: pending, applied, rejected |
| decision_reason | TEXT | NULL | Decision justification |
| decided_by | CUID | FK → users.id, NULL | Decision maker |
| decided_at | TIMESTAMPTZ | NULL | Decision time |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update time |

**Indexes:**
- `idx_reconciliation_items_workspace_id` - All items in workspace
- `idx_reconciliation_items_session_id` - Items in a session
- `idx_reconciliation_items_decision` - Filter by decision status
- `idx_reconciliation_items_confidence` - Filter by confidence level
- `idx_reconciliation_items_target_clause_id` - Items for clause
- `idx_reconciliation_items_target_variable_id` - Items for variable

---

### Golden Record Tables

#### 12. `golden_records`
Exportable structured deal data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CUID | PK | Golden record identifier |
| workspace_id | CUID | UNIQUE, FK → workspaces.id, CASCADE | One per workspace |
| status | ENUM(GoldenRecordStatus) | DEFAULT 'IN_REVIEW' | Status: READY, IN_REVIEW |
| integrity_score | FLOAT | DEFAULT 0 | Graph integrity score (0-1) |
| unresolved_high_drift_count | INTEGER | DEFAULT 0 | HIGH drift blockers |
| last_export_at | TIMESTAMPTZ | NULL | Last JSON export |
| last_publish_at | TIMESTAMPTZ | NULL | Last publish time |
| schema_json | TEXT | DEFAULT '{}' | Cached export schema |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update time |

---

#### 13. `downstream_connectors`
Integration endpoints for servicing systems.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CUID | PK | Connector identifier |
| workspace_id | CUID | FK → workspaces.id, NOT NULL, CASCADE | Parent workspace |
| name | VARCHAR(255) | NOT NULL | Connector name |
| type | ENUM(ConnectorType) | NOT NULL | Type: LoanIQ, Finastra, Allvue, CovenantTracker |
| status | ENUM(ConnectorStatus) | DEFAULT 'DISCONNECTED' | Status: READY, IN_REVIEW, DISCONNECTED |
| last_sync_at | TIMESTAMPTZ | NULL | Last sync time |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update time |

**Indexes:**
- `idx_downstream_connectors_workspace_id` - All connectors in workspace
- `idx_downstream_connectors_type` - Filter by type
- `idx_downstream_connectors_status` - Filter by status

---

#### 14. `covenants`
Extracted covenant definitions for export.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CUID | PK | Covenant identifier |
| workspace_id | CUID | FK → workspaces.id, NOT NULL, CASCADE | Parent workspace |
| name | VARCHAR(255) | NOT NULL | Covenant name |
| test_frequency | VARCHAR(255) | NOT NULL | Test schedule |
| threshold | VARCHAR(255) | NOT NULL | Threshold value |
| calculation_basis | TEXT | NOT NULL | Calculation formula |
| clause_id | CUID | FK → clauses.id, NOT NULL, CASCADE | Source clause |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update time |

**Indexes:**
- `idx_covenants_workspace_id` - All covenants in workspace
- `idx_covenants_clause_id` - Covenants for clause

---

### Audit Tables

#### 15. `audit_events`
**IMMUTABLE** audit trail - append-only, no updates or deletes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CUID | PK | Event identifier |
| workspace_id | CUID | FK → workspaces.id, NULL, SET NULL | Associated workspace (NULL for global events) |
| timestamp | TIMESTAMPTZ | DEFAULT NOW() | Event time |
| actor_id | CUID | FK → users.id, NOT NULL | User who performed action |
| actor_name | VARCHAR(255) | NOT NULL | Snapshot of actor name |
| event_type | ENUM(AuditEventType) | NOT NULL | Event category |
| target_type | VARCHAR(255) | NULL | Target entity type |
| target_id | VARCHAR(255) | NULL | Target entity ID |
| before_state | TEXT | NULL | State before change |
| after_state | TEXT | NULL | State after change |
| reason | TEXT | NULL | User-provided reason |
| reason_category | ENUM(ReasonCategory) | NULL | Category: borrower_request, market_conditions, credit_update, legal_requirement, other |

**Event Types (21 total):**
```
LOGIN, LOGOUT, WORKSPACE_CREATE, INVITE_SENT, ROLE_CHANGED, 
MEMBER_REMOVED, CLAUSE_EDIT, VARIABLE_EDIT, VARIABLE_BIND, 
GRAPH_SYNC, DRIFT_OVERRIDE, DRIFT_REVERT, DRIFT_APPROVE, 
RECON_APPLY, RECON_REJECT, PUBLISH, EXPORT_JSON, EXPORT_AUDIT,
GOVERNANCE_UPDATED, SECTION_LOCKED, SECTION_UNLOCKED
```

**Reason Categories (5 total):**
```
borrower_request, market_conditions, credit_update, 
legal_requirement, other
```

**Indexes:**
- `idx_audit_events_workspace_id` - All events in workspace
- `idx_audit_events_actor_id` - Events by user
- `idx_audit_events_event_type` - Filter by event type
- `idx_audit_events_timestamp` - Chronological queries

**IMPORTANT**: This table is append-only. Implement triggers/policies to prevent UPDATE and DELETE operations.

---
#### 16. `refresh_tokens`
Stores refresh tokens for JWT authentication.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CUID | PK | Token identifier |
| token | VARCHAR(500) | UNIQUE, NOT NULL | Refresh token value |
| user_id | CUID | FK → users.id, NOT NULL | Token owner |
| expires_at | TIMESTAMPTZ | NOT NULL | Token expiry |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation time |
| revoked_at | TIMESTAMPTZ | NULL | Revocation time |

**Indexes:**
- `idx_refresh_tokens_user_id` - Find all tokens for user
- `idx_refresh_tokens_expires_at` - Cleanup expired tokens

---
## Migration Strategy

### Phase 1: Neon Setup (Day 1-2)
1. Create Neon account at [neon.tech](https://neon.tech)
2. Create new project and database
3. Copy connection strings (pooled + direct)
4. Configure environment variables

### Phase 2: Prisma Integration (Day 3-5)
1. Initialize Prisma: `npx prisma init`
2. Configure `schema.prisma` with Neon connection
3. Define all models (see SCHEMA.md)
4. Run initial migration: `npx prisma migrate dev --name init`
5. Generate Prisma client: `npx prisma generate`

### Phase 3: Backend Integration (Week 2)
1. Create repository layer using Prisma client
2. Replace mock services with real database calls
3. Implement seed script from existing mock data
4. Test all CRUD operations

### Phase 4: Production Deployment (Week 3)
1. Create production branch in Neon
2. Run migrations on production
3. Configure production environment variables
4. Deploy backend to hosting platform

---

## Neon-Specific Features

### Database Branching
```bash
# Create a development branch from main
neon branches create --name dev --parent main

# Each branch gets its own connection string
# Perfect for testing migrations without affecting production
```

### Connection Pooling (Built-in)
Neon includes PgBouncer by default. Use the pooled connection string:
```env
# Add ?pgbouncer=true to enable connection pooling
DATABASE_URL="postgresql://...?sslmode=require&pgbouncer=true"
```

### Auto-suspend
- Compute automatically suspends after 5 minutes of inactivity (configurable)
- First query after suspend has ~500ms cold start
- Keeps costs low for development/staging

---

## Performance Considerations

### Indexing Strategy
- All foreign keys have indexes
- Composite indexes for common query patterns
- GIN indexes for JSONB and full-text search
- Partial indexes for filtered queries (e.g., `WHERE status = 'active'`)

### Connection Pooling
- Use Neon's built-in PgBouncer (add `?pgbouncer=true` to connection string)
- For Prisma, configure connection limit in schema:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### Query Optimization
- Use `EXPLAIN ANALYZE` for slow queries
- Denormalize `integrity_score` and `unresolved_high_drift_count` for fast reads
- Cache golden record schema JSON

### Backup Strategy (Neon Managed)
- Automatic point-in-time recovery (7 days on free tier, 30 days on paid)
- Instant branching for backup snapshots
- No manual backup configuration needed

---

## Security Considerations

1. **SSL Required**: Neon enforces SSL connections by default (`sslmode=require`)
2. **IP Allowlisting**: Configure allowed IPs in Neon dashboard (optional)
3. **Connection Secrets**: Store credentials in environment variables, never commit
4. **Audit Table Protection**: Implement via Prisma middleware (no raw DELETE/UPDATE)
5. **Sensitive Data**: Hash passwords with bcrypt, Neon encrypts data at rest
