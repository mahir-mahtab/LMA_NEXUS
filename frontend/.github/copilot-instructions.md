# LMA Nexus - AI Coding Instructions

## Project Overview
LMA Nexus is a **Digital Loan Documentation Platform** that transforms loan agreements into intelligent, structured "digital twins". Built with React 19 + TypeScript, using a mock database layer (localStorage persistence) for demo purposes.

## Architecture

### Provider Hierarchy (Critical Order)
Providers must wrap in this exact order in `App.tsx`:
```
ThemeProvider → AuthProvider → WorkspaceProvider → PermissionProvider → AuditProvider → ToastProvider
```
Each provider depends on the ones above it (e.g., `PermissionProvider` uses `useWorkspace()`).

### Directory Structure
- **`/src/stores/`** - React Context providers for global state (Auth, Workspace, Permission, Audit, Theme)
- **`/src/services/`** - Business logic layer with simulated network latency; interacts with `mock/mockDb.ts`
- **`/src/features/`** - Page-level components by domain (one file per feature: `DraftingPage.tsx`, `GoldenRecordPage.tsx`)
- **`/src/components/`** - Reusable UI components organized by category (`ui/`, `feedback/`, `layout/`, domain-specific)
- **`/src/types/`** - TypeScript domain models; each domain has its own file
- **`/src/mock/`** - In-memory database with localStorage persistence; `seed.ts` contains test data

### Data Flow
```
UI Component → Service Function → mockDb (getState/setState) → localStorage
```
Services simulate async operations with configurable latency (`SIMULATED_LATENCY = 0` in tests).

## Key Patterns

### Permission-Driven UI
Always check permissions before rendering actions:
```tsx
const { can } = usePermission();
const canEdit = can('draft:editText');
// Use canEdit to conditionally render edit buttons
```
Permissions are defined in `types/permissions.ts` with `ROLE_PERMISSIONS` mapping roles to Permission arrays.

### Workspace-Scoped Operations
All domain operations require a `workspaceId`. Get it from `useParams()` or `useWorkspace()`:
```tsx
const { workspaceId } = useParams<{ workspaceId: string }>();
const { activeWorkspace } = useWorkspace();
```

### Service Result Pattern
All services return `{ success: boolean; data?: T; error?: ServiceError }`:
```tsx
const result = await getGoldenRecord(workspaceId);
if (result.success && result.goldenRecord) { /* use data */ }
else { showError(result.error?.message || 'Failed'); }
```

### Audit Trail Integration
Sensitive operations require reason tracking. Use `ReasonModal` component with `ReasonCategory` types:
```tsx
const reasonCategories: ReasonCategory[] = ['borrower_request', 'market_conditions', 'credit_update', 'legal_requirement', 'other'];
```

### Cross-Service Dependencies
Services are wired together for cascading updates (see `cross-module.integration.test.ts`):
```ts
draftService.setGraphServiceRecompute(graphService.recomputeGraph);
draftService.setDriftServiceRecompute(driftService.recomputeDrift);
```

## Component Conventions

### UI Components (`/src/components/ui/`)
Use existing primitives: `Button`, `Badge`, `Card`, `Table`, `Input`, `Select`, `EmptyState`, `LoadingSkeleton`, `JsonViewer`

### Layout Components
- `SplitPaneLayout` - Three-panel layout (outline | editor | inspector)
- `ClauseOutline`, `ClauseEditor`, `InspectorPanel` - Drafting-specific layouts
- `AppLayout` - Main authenticated shell with Sidebar/TopBar (conditionally shown based on workspace context)

### Feedback Components
- `Toast`/`useToastHelpers()` - Notifications via `ToastProvider`
- `ReasonModal` - Audit reason capture for sensitive operations
- `ConfirmDangerModal` - Destructive action confirmation

## Testing

### Commands
```bash
pnpm test              # Run all tests (watch mode)
pnpm test --coverage   # Coverage report
```

### Test Types
- **Property-based tests** (`__tests__/properties/*.property.test.ts`) - Uses `fast-check` for invariant testing
- **Integration tests** (`__tests__/integration/`) - Cross-module flow validation
- **Component tests** (`*.test.tsx`) - React Testing Library

### Test Setup Pattern
```ts
import { resetToSeed } from '../../mock/mockDb';
import '../../mock/seed'; // Initialize seed data

beforeEach(() => {
  resetToSeed(); // Clean state before each test
});
```

## Domain Model Reference

| Domain | Types File | Service | Key Concepts |
|--------|-----------|---------|--------------|
| Drafting | `document.ts` | `draftService` | Clause, Variable, isSensitive flag triggers audit |
| Graph | `graph.ts` | `graphService` | GraphNode, GraphEdge, integrityScore (0-100) |
| Drift | `drift.ts` | `driftService` | DriftItem, severity (HIGH/MEDIUM/LOW), blocks publish when HIGH unresolved |
| Reconciliation | `reconciliation.ts` | `reconciliationService` | AI-powered markup integration, confidence scoring |
| Golden Record | `golden-record.ts` | `goldenRecordService` | Export schema, connectors (LoanIQ/Finastra/Allvue), publish gating |

## Styling
- **Tailwind CSS** with dark mode support via `dark:` variants
- Theme toggle persisted in localStorage via `ThemeProvider`
- Use `clsx()` for conditional class composition
- Standard color tokens: `primary-*`, `gray-*`, `slate-*` (dark mode)

## Requirements Traceability
File headers contain `Requirements: X.X` comments linking to specification IDs. Preserve these when editing.
