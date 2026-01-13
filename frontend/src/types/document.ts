/**
 * Document and drafting types
 * Requirements: 4.1, 4.4
 */

export type ClauseType = 'financial' | 'covenant' | 'definition' | 'xref' | 'general';

export interface Clause {
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

export type VariableType = 'financial' | 'definition' | 'covenant' | 'ratio';

export interface Variable {
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
