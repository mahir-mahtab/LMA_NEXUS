/**
 * AI reconciliation types
 * Requirements: 8.1, 8.2
 */

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type ReconciliationDecision = 'pending' | 'applied' | 'rejected';

export interface ReconciliationItem {
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

export interface ReconciliationSession {
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
