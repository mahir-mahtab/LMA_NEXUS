/**
 * Frontend-aligned DTO types.
 *
 * These mirror `lma-nexus/src/types/**` so the API can be consistent
 * even if internal persistence differs.
 */

export type ClauseType = 'financial' | 'covenant' | 'definition' | 'xref' | 'general';
export type VariableType = 'financial' | 'definition' | 'covenant' | 'ratio';
export type NodeType = 'financial' | 'covenant' | 'definition' | 'xref';

export type DriftSeverity = 'HIGH' | 'MEDIUM' | 'LOW';
export type DriftStatus = 'unresolved' | 'overridden' | 'reverted' | 'approved';

export interface ClauseDTO {
  id: string;
  workspaceId: string;
  title: string;
  body: string;
  type: ClauseType;
  order: number;
  isSensitive: boolean;
  isLocked: boolean;
  lockedBy?: string;
  lockedAt?: string;
  lastModifiedAt: string;
  lastModifiedBy: string;
}

export interface VariableDTO {
  id: string;
  workspaceId: string;
  clauseId: string;
  label: string;
  type: VariableType;
  value: string;
  unit?: string;
  baselineValue?: string;
  createdAt: string;
  lastModifiedAt: string;
}

export interface GraphNodeDTO {
  id: string;
  workspaceId: string;
  label: string;
  type: NodeType;
  clauseId?: string;
  variableId?: string;
  value?: string;
  hasDrift: boolean;
  hasWarning: boolean;
}

export interface GraphEdgeDTO {
  id: string;
  workspaceId: string;
  sourceId: string;
  targetId: string;
  weight: number;
}

export interface GraphStateDTO {
  nodes: GraphNodeDTO[];
  edges: GraphEdgeDTO[];
  integrityScore: number;
  lastComputedAt: string;
}

export interface DriftItemDTO {
  id: string;
  workspaceId: string;
  clauseId: string;
  variableId?: string;
  title: string;
  type: ClauseType;
  severity: DriftSeverity;
  baselineValue: string;
  baselineApprovedAt: string;
  currentValue: string;
  currentModifiedAt: string;
  currentModifiedBy: string;
  status: DriftStatus;
  approvedBy?: string;
  approvedAt?: string;
  approvalReason?: string;
}

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type ReconciliationDecision = 'pending' | 'applied' | 'rejected';

export interface ReconciliationItemDTO {
  id: string;
  workspaceId: string;
  sessionId: string;
  incomingSnippet: string;
  targetClauseId: string;
  targetVariableId?: string;
  confidence: ConfidenceLevel;
  baselineValue: string;
  currentValue: string;
  proposedValue: string;
  decision: ReconciliationDecision;
  decisionReason?: string;
  decidedBy?: string;
  decidedAt?: string;
}

export interface ReconciliationSessionDTO {
  id: string;
  workspaceId: string;
  fileName: string;
  fileType: 'docx' | 'pdf';
  uploadedAt: string;
  uploadedBy: string;
  totalItems: number;
  appliedCount: number;
  rejectedCount: number;
  pendingCount: number;
}

export type AuditEventType =
  | 'LOGIN'
  | 'LOGOUT'
  | 'WORKSPACE_CREATE'
  | 'INVITE_SENT'
  | 'ROLE_CHANGED'
  | 'MEMBER_REMOVED'
  | 'CLAUSE_EDIT'
  | 'VARIABLE_EDIT'
  | 'VARIABLE_BIND'
  | 'GRAPH_SYNC'
  | 'DRIFT_OVERRIDE'
  | 'DRIFT_REVERT'
  | 'DRIFT_APPROVE'
  | 'RECON_APPLY'
  | 'RECON_REJECT'
  | 'PUBLISH'
  | 'EXPORT_JSON'
  | 'EXPORT_AUDIT'
  | 'GOVERNANCE_UPDATED'
  | 'SECTION_LOCKED'
  | 'SECTION_UNLOCKED';

export type ReasonCategory =
  | 'borrower_request'
  | 'market_conditions'
  | 'credit_update'
  | 'legal_requirement'
  | 'other';

export interface AuditEventDTO {
  id: string;
  workspaceId: string | null;
  timestamp: string;
  actorId: string;
  actorName: string;
  eventType: AuditEventType;
  targetType?: string;
  targetId?: string;
  beforeState?: string;
  afterState?: string;
  reason?: string;
  reasonCategory?: ReasonCategory;
}
