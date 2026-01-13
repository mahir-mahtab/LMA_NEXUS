/**
 * Golden record export types
 * Requirements: 9.1, 9.5, 9.6
 */

export type ConnectorStatus = 'READY' | 'IN_REVIEW' | 'DISCONNECTED';

export interface DownstreamConnector {
  id: string;
  name: string;
  type: 'LoanIQ' | 'Finastra' | 'Allvue' | 'CovenantTracker';
  status: ConnectorStatus;
  lastSyncAt?: string;
}

export interface Covenant {
  id: string;
  workspaceId: string;
  name: string;
  testFrequency: string;
  threshold: string;
  calculationBasis: string;
  clauseId: string;
}

export interface GoldenRecord {
  workspaceId: string;
  status: 'READY' | 'IN_REVIEW';
  integrityScore: number;
  unresolvedHighDriftCount: number;
  lastExportAt?: string;
  lastPublishAt?: string;
  connectors: DownstreamConnector[];
  covenants: Covenant[];
  schemaJson: string;
}
