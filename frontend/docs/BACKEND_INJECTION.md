# Backend Injection Guide

## Overview

This document identifies all the files in the LMA Nexus frontend that need to be updated when transitioning from the mock backend to real HTTP requests. All locations marked with `// backend paisi` comments indicate where `fetch()` or HTTP client calls should be implemented.

---

## Injection Strategy

Replace the mock `await delay()` calls with actual HTTP requests to the backend API endpoints. The backend should be accessible via environment variable `REACT_APP_API_URL` (e.g., `http://localhost:3000/api`).

### Pattern

**Before (Mock):**
```typescript
export async function login(email: string, password: string): Promise<LoginResult> {
  // backend paisi
  await delay();
  // ... mock implementation
}
```

**After (Real Backend):**
```typescript
export async function login(email: string, password: string): Promise<LoginResult> {
  // backend paisi - fetch to backend
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  // ... handle response
}
```

---

## Files Requiring Backend Integration

### 1. **Authentication Service**
- **File:** `src/services/authService.ts`
- **Functions with backend paisi comments:**
  - `login()` - POST `/auth/login`
  - `logout()` - POST `/auth/logout`
  - `getCurrentSession()` - GET `/auth/session`
  - `getSessionsForUser()` - GET `/auth/sessions/:userId`

**Backend Endpoints Needed:**
```
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/session
GET    /api/auth/sessions/:userId
```

---

### 2. **Workspace Service**
- **File:** `src/services/workspaceService.ts`
- **Functions with backend paisi comments:**
  - `listWorkspacesForUser()` - GET `/workspaces`
  - `getWorkspace()` - GET `/workspaces/:id`
  - `createWorkspace()` - POST `/workspaces`
  - `inviteMember()` - POST `/workspaces/:id/members/invite`
  - `listMembers()` - GET `/workspaces/:id/members`
  - `getMemberWithUser()` - GET `/workspaces/members/:id`
  - `changeRole()` - PUT `/workspaces/:id/members/:memberId/role`
  - `removeMember()` - DELETE `/workspaces/:id/members/:memberId`
  - `getUserMembership()` - GET `/workspaces/:id/members/user/:userId`
  - `updateGovernanceRules()` - PUT `/workspaces/:id/governance`

**Backend Endpoints Needed:**
```
GET    /api/workspaces
GET    /api/workspaces/:id
POST   /api/workspaces
POST   /api/workspaces/:id/members/invite
GET    /api/workspaces/:id/members
GET    /api/workspaces/members/:id
PUT    /api/workspaces/:id/members/:memberId/role
DELETE /api/workspaces/:id/members/:memberId
GET    /api/workspaces/:id/members/user/:userId
PUT    /api/workspaces/:id/governance
```

---

### 3. **Audit Service**
- **File:** `src/services/auditService.ts`
- **Functions with backend paisi comments:**
  - `logEvent()` - POST `/audit/events`
  - `listEvents()` - GET `/audit/events`
  - `getEvent()` - GET `/audit/events/:id`
  - `exportAudit()` - POST `/audit/export`

**Backend Endpoints Needed:**
```
POST   /api/audit/events
GET    /api/audit/events
GET    /api/audit/events/:id
POST   /api/audit/export
```

---

### 4. **Draft Service**
- **File:** `src/services/draftService.ts`
- **Functions with backend paisi comments:**
  - `getDocumentOutline()` - GET `/workspaces/:id/clauses`
  - `getClause()` - GET `/clauses/:id`
  - `getVariablesForClause()` - GET `/clauses/:id/variables`
  - `updateClauseText()` - PUT `/clauses/:id`
  - `bindVariable()` - POST `/variables`
  - `updateVariable()` - PUT `/variables/:id`
  - `syncToGraph()` - POST `/workspaces/:id/sync`
  - `getClausesForWorkspace()` - GET `/workspaces/:id/clauses`
  - `getVariablesForWorkspace()` - GET `/workspaces/:id/variables`

**Backend Endpoints Needed:**
```
GET    /api/workspaces/:id/clauses
GET    /api/clauses/:id
GET    /api/clauses/:id/variables
PUT    /api/clauses/:id
POST   /api/variables
PUT    /api/variables/:id
POST   /api/workspaces/:id/sync
GET    /api/workspaces/:id/variables
```

---

### 5. **Graph Service**
- **File:** `src/services/graphService.ts`
- **Functions with backend paisi comments:**
  - `getGraph()` - GET `/workspaces/:id/graph`
  - `recomputeGraph()` - POST `/workspaces/:id/graph/recompute`
  - `locateNode()` - GET `/graph/nodes/:id/locate`
  - `getNode()` - GET `/graph/nodes/:id`
  - `getConnectedNodes()` - GET `/graph/nodes/:id/connected`

**Backend Endpoints Needed:**
```
GET    /api/workspaces/:id/graph
POST   /api/workspaces/:id/graph/recompute
GET    /api/graph/nodes/:id/locate
GET    /api/graph/nodes/:id
GET    /api/graph/nodes/:id/connected
```

---

### 6. **Drift Service**
- **File:** `src/services/driftService.ts`
- **Functions with backend paisi comments:**
  - `listDrift()` - GET `/workspaces/:id/drift`
  - `getDrift()` - GET `/drift/:id`
  - `overrideBaseline()` - POST `/drift/:id/override`
  - `revertDraft()` - POST `/drift/:id/revert`
  - `recomputeDrift()` - POST `/workspaces/:id/drift/recompute`
  - `getUnresolvedHighDriftCount()` - GET `/workspaces/:id/drift/high-count`
  - `approveDrift()` - POST `/drift/:id/approve`

**Backend Endpoints Needed:**
```
GET    /api/workspaces/:id/drift
GET    /api/drift/:id
POST   /api/drift/:id/override
POST   /api/drift/:id/revert
POST   /api/workspaces/:id/drift/recompute
GET    /api/workspaces/:id/drift/high-count
POST   /api/drift/:id/approve
```

---

### 7. **Reconciliation Service**
- **File:** `src/services/reconciliationService.ts`
- **Functions with backend paisi comments:**
  - `uploadDirtyDraft()` - POST `/workspaces/:id/reconciliation/upload` (multipart/form-data)
  - `listReconciliationItems()` - GET `/workspaces/:id/reconciliation/items`
  - `getSession()` - GET `/reconciliation/sessions/:id`
  - `applySuggestion()` - POST `/reconciliation/items/:id/apply`
  - `rejectSuggestion()` - POST `/reconciliation/items/:id/reject`
  - `getItem()` - GET `/reconciliation/items/:id`

**Backend Endpoints Needed:**
```
POST   /api/workspaces/:id/reconciliation/upload
GET    /api/workspaces/:id/reconciliation/items
GET    /api/reconciliation/sessions/:id
POST   /api/reconciliation/items/:id/apply
POST   /api/reconciliation/items/:id/reject
GET    /api/reconciliation/items/:id
```

---

### 8. **Golden Record Service**
- **File:** `src/services/goldenRecordService.ts`
- **Functions with backend paisi comments:**
  - `getGoldenRecord()` - GET `/workspaces/:id/golden-record`
  - `exportSchema()` - POST `/workspaces/:id/golden-record/export`
  - `publish()` - POST `/workspaces/:id/golden-record/publish`
  - `getCovenants()` - GET `/workspaces/:id/covenants`
  - `getConnectors()` - GET `/workspaces/:id/connectors`
  - `testConnection()` - POST `/connectors/:id/test`

**Backend Endpoints Needed:**
```
GET    /api/workspaces/:id/golden-record
POST   /api/workspaces/:id/golden-record/export
POST   /api/workspaces/:id/golden-record/publish
GET    /api/workspaces/:id/covenants
GET    /api/workspaces/:id/connectors
POST   /api/connectors/:id/test
```

---

## Summary of Changes

| Service | File | Functions | Total Endpoints |
|---------|------|-----------|-----------------|
| Auth | `authService.ts` | 4 | 4 |
| Workspace | `workspaceService.ts` | 10 | 10 |
| Audit | `auditService.ts` | 4 | 4 |
| Draft | `draftService.ts` | 9 | 8 |
| Graph | `graphService.ts` | 5 | 5 |
| Drift | `driftService.ts` | 7 | 7 |
| Reconciliation | `reconciliationService.ts` | 6 | 6 |
| Golden Record | `goldenRecordService.ts` | 6 | 6 |
| **TOTALS** | **8 files** | **51 functions** | **50+ endpoints** |

---

## Implementation Steps

1. **Setup Backend API Client**
   - Create `src/services/apiClient.ts` with configured fetch wrapper
   - Handle base URL, headers, error handling, token management

2. **Update Each Service File**
   - Replace `await delay()` with HTTP request
   - Remove mock data generation
   - Handle response status codes and errors
   - Update TypeScript types as needed

3. **Add Error Handling**
   - Network errors
   - API validation errors
   - Authentication errors
   - Token refresh logic

4. **Update Environment Variables**
   - Add `REACT_APP_API_URL` to `.env` and `.env.example`
   - Configure for different environments (dev, staging, prod)

5. **Testing**
   - Update service tests to mock HTTP calls instead of delay
   - Test error scenarios
   - Integration tests with real backend

6. **Authentication**
   - Store JWT tokens in secure storage
   - Implement automatic token refresh
   - Clear tokens on logout

---

## Notes

- All functions marked with `// backend paisi` require backend integration
- The mock services currently use `await delay()` for simulated latency
- Maintain the same function signatures and return types for minimal UI changes
- Consider adding loading states and error boundaries in UI components
- Use a consistent API client to handle common concerns (auth, errors, logging)
