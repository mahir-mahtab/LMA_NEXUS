/**
 * Graph visualization types
 * Requirements: 5.4, 6.1
 */

export type NodeType = 'financial' | 'covenant' | 'definition' | 'xref';

export interface GraphNode {
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

export interface GraphEdge {
  id: string;
  workspaceId: string;
  sourceId: string;
  targetId: string;
  weight: number; // 1-5
}

export interface GraphState {
  nodes: GraphNode[];
  edges: GraphEdge[];
  integrityScore: number;
  lastComputedAt: string;
}
