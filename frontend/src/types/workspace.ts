/**
 * Workspace and governance types
 * Requirements: 2.1, 3.1
 */

export interface GovernanceRules {
  requireReasonForSensitiveEdits: boolean;
  legalCanRevertDraft: boolean;
  riskApprovalRequiredForOverride: boolean;
  publishBlockedWhenHighDrift: boolean;
  definitionsLockedAfterApproval: boolean;
  externalCounselReadOnly: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  currency: string;
  amount: number;
  standard: string;
  basePdfName?: string;
  createdAt: string;
  lastSyncAt: string;
  createdBy: string;
  governanceRules: GovernanceRules;
}
