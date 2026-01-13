/**
 * Commercial drift detection types
 * Requirements: 7.1
 */

import { ClauseType } from './document';

export type DriftSeverity = 'HIGH' | 'MEDIUM' | 'LOW';
export type DriftStatus = 'unresolved' | 'overridden' | 'reverted' | 'approved';

export interface DriftItem {
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
