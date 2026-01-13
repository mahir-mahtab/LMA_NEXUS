/**
 * Audit logging types
 * Requirements: 11.1
 */

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

export interface AuditEvent {
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
