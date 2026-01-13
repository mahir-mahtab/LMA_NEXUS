import { prisma } from '../index.js';
import { NodeType, ClauseType, VariableType, AuditEventType, DriftStatus } from '@prisma/client';

// ============================================
// TYPES
// ============================================

export interface GraphNodeResponse {
  id: string;
  workspaceId: string;
  label: string;
  type: NodeType;
  clauseId: string | null;
  variableId: string | null;
  value: string | null;
  hasDrift: boolean;
  hasWarning: boolean;
}

export interface GraphEdgeResponse {
  id: string;
  workspaceId: string;
  sourceId: string;
  targetId: string;
  weight: number;
}

export interface GraphStateResponse {
  nodes: GraphNodeResponse[];
  edges: GraphEdgeResponse[];
  integrityScore: number;
  lastComputedAt: string;
}

export interface ServiceError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface GetGraphResult {
  success: boolean;
  graph?: GraphStateResponse;
  error?: ServiceError;
}

export interface RecomputeGraphResult {
  success: boolean;
  integrityScore?: number;
  nodeCount?: number;
  edgeCount?: number;
  error?: ServiceError;
}

export interface LocateNodeResult {
  success: boolean;
  clauseId?: string;
  variableId?: string;
  error?: ServiceError;
}

export interface GetNodeResult {
  success: boolean;
  node?: GraphNodeResponse;
  error?: ServiceError;
}

export interface GetConnectedNodesResult {
  success: boolean;
  nodes?: GraphNodeResponse[];
  error?: ServiceError;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatNode(node: any): GraphNodeResponse {
  return {
    id: node.id,
    workspaceId: node.workspaceId,
    label: node.label,
    type: node.type,
    clauseId: node.clauseId,
    variableId: node.variableId,
    value: node.value,
    hasDrift: node.hasDrift,
    hasWarning: node.hasWarning,
  };
}

function formatEdge(edge: any): GraphEdgeResponse {
  return {
    id: edge.id,
    workspaceId: edge.workspaceId,
    sourceId: edge.sourceId,
    targetId: edge.targetId,
    weight: edge.weight,
  };
}

/**
 * Map clause type to node type
 */
function clauseTypeToNodeType(clauseType: ClauseType): NodeType {
  switch (clauseType) {
    case ClauseType.financial:
      return NodeType.financial;
    case ClauseType.covenant:
      return NodeType.covenant;
    case ClauseType.definition:
      return NodeType.definition;
    case ClauseType.xref:
      return NodeType.xref;
    case ClauseType.general:
    default:
      return NodeType.definition;
  }
}

/**
 * Map variable type to node type
 */
function variableTypeToNodeType(variableType: VariableType): NodeType {
  switch (variableType) {
    case VariableType.financial:
      return NodeType.financial;
    case VariableType.covenant:
      return NodeType.covenant;
    case VariableType.definition:
      return NodeType.definition;
    case VariableType.ratio:
      return NodeType.covenant;
    default:
      return NodeType.definition;
  }
}

/**
 * Check if variable has drift
 */
function hasDrift(value: string, baselineValue: string | null): boolean {
  if (!baselineValue) return false;
  return value !== baselineValue;
}

/**
 * Format variable value for display
 */
function formatVariableValue(value: string, unit: string | null): string {
  if (unit) {
    return `${value} ${unit}`;
  }
  return value;
}

/**
 * Calculate edge weight based on relationship type
 */
function calculateEdgeWeight(sourceType: NodeType, targetType: NodeType, isVariableToClause: boolean): number {
  if (isVariableToClause) return 5;
  if (sourceType === targetType) return 4;
  if (
    (sourceType === NodeType.financial && targetType === NodeType.covenant) ||
    (sourceType === NodeType.covenant && targetType === NodeType.financial)
  ) {
    return 4;
  }
  if (sourceType === NodeType.definition || targetType === NodeType.definition) {
    return 3;
  }
  if (sourceType === NodeType.xref || targetType === NodeType.xref) {
    return 2;
  }
  return 3;
}

// ============================================
// SERVICE FUNCTIONS
// ============================================

/**
 * Get the current graph state for a workspace
 */
export async function getGraph(
  workspaceId: string,
  userId: string
): Promise<GetGraphResult> {
  // Verify user has access to workspace
  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId,
      },
    },
  });

  if (!member) {
    return {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied to this workspace',
      },
    };
  }

  // Get nodes, edges, and graph state
  const [nodes, edges, graphState] = await Promise.all([
    prisma.graphNode.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.graphEdge.findMany({
      where: { workspaceId },
    }),
    prisma.graphState.findUnique({
      where: { workspaceId },
    }),
  ]);

  // Calculate integrity score if not stored
  let integrityScore = graphState?.integrityScore ?? 100;
  if (!graphState && nodes.length > 0) {
    const nodesWithDrift = nodes.filter((n) => n.hasDrift).length;
    const nodesWithWarning = nodes.filter((n) => n.hasWarning).length;
    const totalNodes = nodes.length;
    const driftPenalty = (nodesWithDrift / totalNodes) * 30;
    const warningPenalty = (nodesWithWarning / totalNodes) * 20;
    integrityScore = Math.max(0, Math.round(100 - driftPenalty - warningPenalty));
  }

  const graph: GraphStateResponse = {
    nodes: nodes.map(formatNode),
    edges: edges.map(formatEdge),
    integrityScore,
    lastComputedAt: graphState?.lastComputedAt?.toISOString() || new Date().toISOString(),
  };

  return {
    success: true,
    graph,
  };
}

/**
 * Recompute the graph from current clauses and variables
 */
export async function recomputeGraph(
  workspaceId: string,
  userId: string,
  actorName: string
): Promise<RecomputeGraphResult> {
  // Verify user has access to workspace
  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId,
      },
    },
  });

  if (!member) {
    return {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied to this workspace',
      },
    };
  }

  // Get clauses, variables, and drift items
  const [clauses, variables, driftItems] = await Promise.all([
    prisma.clause.findMany({
      where: { workspaceId },
      orderBy: { order: 'asc' },
    }),
    prisma.variable.findMany({
      where: { workspaceId },
    }),
    prisma.driftItem.findMany({
      where: {
        workspaceId,
        status: DriftStatus.unresolved,
      },
    }),
  ]);

  // Create maps for drift detection
  const variablesWithDrift = new Set(
    driftItems.filter((d) => d.variableId).map((d) => d.variableId)
  );
  const clausesWithDrift = new Set(driftItems.map((d) => d.clauseId));

  // Build nodes from clauses (exclude general clauses)
  const clauseNodes: Array<{
    id: string;
    workspaceId: string;
    label: string;
    type: NodeType;
    clauseId: string;
    variableId: null;
    value: null;
    hasDrift: boolean;
    hasWarning: boolean;
  }> = clauses
    .filter((c) => c.type !== ClauseType.general)
    .map((clause) => ({
      id: `node-c-${clause.id}`,
      workspaceId,
      label: clause.title.replace(/^\d+\.\s*/, ''),
      type: clauseTypeToNodeType(clause.type),
      clauseId: clause.id,
      variableId: null,
      value: null,
      hasDrift: clausesWithDrift.has(clause.id),
      hasWarning: clause.isSensitive && clausesWithDrift.has(clause.id),
    }));

  // Build nodes from variables
  const variableNodes: Array<{
    id: string;
    workspaceId: string;
    label: string;
    type: NodeType;
    clauseId: null;
    variableId: string;
    value: string;
    hasDrift: boolean;
    hasWarning: boolean;
  }> = variables.map((variable) => ({
    id: `node-v-${variable.id}`,
    workspaceId,
    label: variable.label,
    type: variableTypeToNodeType(variable.type),
    clauseId: null,
    variableId: variable.id,
    value: formatVariableValue(variable.value, variable.unit),
    hasDrift: variablesWithDrift.has(variable.id) || hasDrift(variable.value, variable.baselineValue),
    hasWarning: variablesWithDrift.has(variable.id),
  }));

  const allNodes = [...clauseNodes, ...variableNodes];

  // Build edges
  const edges: Array<{
    workspaceId: string;
    sourceId: string;
    targetId: string;
    weight: number;
  }> = [];

  // Create edges from variables to their clauses
  for (const variable of variables) {
    const variableNode = allNodes.find((n) => n.variableId === variable.id);
    const clauseNode = allNodes.find((n) => n.clauseId === variable.clauseId);

    if (variableNode && clauseNode) {
      edges.push({
        workspaceId,
        sourceId: variableNode.id,
        targetId: clauseNode.id,
        weight: 5,
      });
    }
  }

  // Create edges between related clauses
  for (let i = 0; i < clauseNodes.length; i++) {
    for (let j = i + 1; j < clauseNodes.length; j++) {
      const nodeA = clauseNodes[i];
      const nodeB = clauseNodes[j];

      const shouldConnect =
        nodeA.type === NodeType.definition ||
        nodeB.type === NodeType.definition ||
        (nodeA.type === NodeType.financial && nodeB.type === NodeType.covenant) ||
        (nodeA.type === NodeType.covenant && nodeB.type === NodeType.financial) ||
        nodeA.type === NodeType.xref ||
        nodeB.type === NodeType.xref;

      if (shouldConnect) {
        edges.push({
          workspaceId,
          sourceId: nodeA.id,
          targetId: nodeB.id,
          weight: calculateEdgeWeight(nodeA.type, nodeB.type, false),
        });
      }
    }
  }

  // Create edges between variables that share the same clause
  const variablesByClause = new Map<string, typeof variableNodes>();
  for (const node of variableNodes) {
    const variable = variables.find((v) => v.id === node.variableId);
    if (variable) {
      const existing = variablesByClause.get(variable.clauseId) || [];
      existing.push(node);
      variablesByClause.set(variable.clauseId, existing);
    }
  }

  for (const [_, clauseVariables] of Array.from(variablesByClause.entries())) {
    for (let i = 0; i < clauseVariables.length; i++) {
      for (let j = i + 1; j < clauseVariables.length; j++) {
        edges.push({
          workspaceId,
          sourceId: clauseVariables[i].id,
          targetId: clauseVariables[j].id,
          weight: 4,
        });
      }
    }
  }

  // Calculate integrity score
  const nodesWithDrift = allNodes.filter((n) => n.hasDrift).length;
  const nodesWithWarning = allNodes.filter((n) => n.hasWarning).length;
  const totalNodes = allNodes.length;

  let integrityScore = 100;
  if (totalNodes > 0) {
    const driftPenalty = (nodesWithDrift / totalNodes) * 30;
    const warningPenalty = (nodesWithWarning / totalNodes) * 20;
    integrityScore = Math.max(0, Math.round(100 - driftPenalty - warningPenalty));
  }

  const now = new Date();

  // Use transaction to update graph data
  await prisma.$transaction(async (tx) => {
    // Delete existing nodes and edges
    await tx.graphEdge.deleteMany({ where: { workspaceId } });
    await tx.graphNode.deleteMany({ where: { workspaceId } });

    // Create new nodes
    if (allNodes.length > 0) {
      await tx.graphNode.createMany({
        data: allNodes,
      });
    }

    // Create new edges
    if (edges.length > 0) {
      await tx.graphEdge.createMany({
        data: edges,
      });
    }

    // Upsert graph state
    await tx.graphState.upsert({
      where: { workspaceId },
      update: {
        integrityScore,
        lastComputedAt: now,
      },
      create: {
        workspaceId,
        integrityScore,
        lastComputedAt: now,
      },
    });

    // Update workspace lastSyncAt
    await tx.workspace.update({
      where: { id: workspaceId },
      data: { lastSyncAt: now },
    });

    // Create audit event
    await tx.auditEvent.create({
      data: {
        workspaceId,
        actorId: userId,
        actorName,
        eventType: AuditEventType.GRAPH_SYNC,
        targetType: 'graph',
        afterState: JSON.stringify({
          nodeCount: allNodes.length,
          edgeCount: edges.length,
          integrityScore,
        }),
      },
    });
  });

  return {
    success: true,
    integrityScore,
    nodeCount: allNodes.length,
    edgeCount: edges.length,
  };
}

/**
 * Locate a node and return its clause ID for navigation
 */
export async function locateNode(
  nodeId: string,
  userId: string
): Promise<LocateNodeResult> {
  const node = await prisma.graphNode.findUnique({
    where: { id: nodeId },
  });

  if (!node) {
    return {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Node not found',
      },
    };
  }

  // Verify user has access
  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId: node.workspaceId,
      },
    },
  });

  if (!member) {
    return {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied',
      },
    };
  }

  // If node has clauseId, return it
  if (node.clauseId) {
    return {
      success: true,
      clauseId: node.clauseId,
    };
  }

  // If node has variableId, find the variable's clause
  if (node.variableId) {
    const variable = await prisma.variable.findUnique({
      where: { id: node.variableId },
    });

    if (variable) {
      return {
        success: true,
        clauseId: variable.clauseId,
        variableId: node.variableId,
      };
    }
  }

  return {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Could not locate clause for this node',
    },
  };
}

/**
 * Get a single node by ID
 */
export async function getNode(
  nodeId: string,
  userId: string
): Promise<GetNodeResult> {
  const node = await prisma.graphNode.findUnique({
    where: { id: nodeId },
  });

  if (!node) {
    return {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Node not found',
      },
    };
  }

  // Verify user has access
  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId: node.workspaceId,
      },
    },
  });

  if (!member) {
    return {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied',
      },
    };
  }

  return {
    success: true,
    node: formatNode(node),
  };
}

/**
 * Get all nodes connected to a given node
 */
export async function getConnectedNodes(
  nodeId: string,
  userId: string
): Promise<GetConnectedNodesResult> {
  const node = await prisma.graphNode.findUnique({
    where: { id: nodeId },
  });

  if (!node) {
    return {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Node not found',
      },
    };
  }

  // Verify user has access
  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId: node.workspaceId,
      },
    },
  });

  if (!member) {
    return {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied',
      },
    };
  }

  // Find all edges connected to this node
  const edges = await prisma.graphEdge.findMany({
    where: {
      OR: [
        { sourceId: nodeId },
        { targetId: nodeId },
      ],
    },
  });

  // Get connected node IDs
  const connectedNodeIds = new Set<string>();
  for (const edge of edges) {
    if (edge.sourceId !== nodeId) connectedNodeIds.add(edge.sourceId);
    if (edge.targetId !== nodeId) connectedNodeIds.add(edge.targetId);
  }

  // Get connected nodes
  const connectedNodes = await prisma.graphNode.findMany({
    where: {
      id: { in: Array.from(connectedNodeIds) },
    },
  });

  return {
    success: true,
    nodes: connectedNodes.map(formatNode),
  };
}
