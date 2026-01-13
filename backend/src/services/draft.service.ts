import { prisma } from '../index.js';
import { ClauseType, VariableType, ReasonCategory } from '@prisma/client';

// ============================================
// TYPES
// ============================================

export interface OutlineItem {
  id: string;
  title: string;
  type: ClauseType;
  order: number;
  isSensitive: boolean;
  isLocked: boolean;
}

export interface ClauseResponse {
  id: string;
  workspaceId: string;
  title: string;
  body: string;
  type: ClauseType;
  order: number;
  isSensitive: boolean;
  isLocked: boolean;
  lockedBy: string | null;
  lockedAt: string | null;
  lastModifiedAt: string;
  lastModifiedBy: string;
}

export interface VariableResponse {
  id: string;
  workspaceId: string;
  clauseId: string;
  label: string;
  type: VariableType;
  value: string;
  unit: string | null;
  baselineValue: string | null;
  createdAt: string;
  lastModifiedAt: string;
  lastModifiedBy: string | null;
}

export interface ServiceError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface UpdateClauseTextInput {
  clauseId: string;
  newBody: string;
  reason?: string;
  reasonCategory?: ReasonCategory;
}

export interface UpdateClauseTextResult {
  success: boolean;
  clause?: ClauseResponse;
  error?: ServiceError;
}

export interface BindVariableInput {
  workspaceId: string;
  clauseId: string;
  label: string;
  type: VariableType;
  value: string;
  unit?: string;
  baselineValue?: string;
}

export interface BindVariableResult {
  success: boolean;
  variable?: VariableResponse;
  error?: ServiceError;
}

export interface UpdateVariableInput {
  label?: string;
  type?: VariableType;
  value?: string;
  unit?: string;
}

export interface UpdateVariableResult {
  success: boolean;
  variable?: VariableResponse;
  error?: ServiceError;
}

export interface SyncToGraphResult {
  success: boolean;
  integrityScore?: number;
  nodeCount?: number;
  edgeCount?: number;
  driftCount?: number;
  error?: ServiceError;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatClause(clause: any): ClauseResponse {
  return {
    id: clause.id,
    workspaceId: clause.workspaceId,
    title: clause.title,
    body: clause.body,
    type: clause.type,
    order: clause.order,
    isSensitive: clause.isSensitive,
    isLocked: clause.isLocked,
    lockedBy: clause.lockedBy,
    lockedAt: clause.lockedAt?.toISOString() || null,
    lastModifiedAt: clause.lastModifiedAt.toISOString(),
    lastModifiedBy: clause.lastModifiedBy,
  };
}

function formatVariable(variable: any): VariableResponse {
  return {
    id: variable.id,
    workspaceId: variable.workspaceId,
    clauseId: variable.clauseId,
    label: variable.label,
    type: variable.type,
    value: variable.value,
    unit: variable.unit,
    baselineValue: variable.baselineValue,
    createdAt: variable.createdAt.toISOString(),
    lastModifiedAt: variable.lastModifiedAt.toISOString(),
    lastModifiedBy: variable.lastModifiedBy,
  };
}

// ============================================
// SERVICE FUNCTIONS
// ============================================

/**
 * Get document outline for a workspace
 * Returns simplified clause list for navigation
 */
export async function getDocumentOutline(
  workspaceId: string,
  userId: string
): Promise<OutlineItem[]> {
  // Verify user has access to workspace
  const membership = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId,
      userId,
      status: 'active',
    },
  });

  if (!membership) {
    return [];
  }

  const clauses = await prisma.clause.findMany({
    where: { workspaceId },
    orderBy: { order: 'asc' },
    select: {
      id: true,
      title: true,
      type: true,
      order: true,
      isSensitive: true,
      isLocked: true,
    },
  });

  return clauses.map((c) => ({
    id: c.id,
    title: c.title,
    type: c.type,
    order: c.order,
    isSensitive: c.isSensitive,
    isLocked: c.isLocked,
  }));
}

/**
 * Get a single clause by ID
 */
export async function getClause(
  clauseId: string,
  userId: string
): Promise<ClauseResponse | null> {
  const clause = await prisma.clause.findUnique({
    where: { id: clauseId },
  });

  if (!clause) {
    return null;
  }

  // Verify user has access to workspace
  const membership = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId: clause.workspaceId,
      userId,
      status: 'active',
    },
  });

  if (!membership) {
    return null;
  }

  return formatClause(clause);
}

/**
 * Get all clauses for a workspace
 */
export async function getClausesForWorkspace(
  workspaceId: string,
  userId: string
): Promise<ClauseResponse[]> {
  // Verify user has access to workspace
  const membership = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId,
      userId,
      status: 'active',
    },
  });

  if (!membership) {
    return [];
  }

  const clauses = await prisma.clause.findMany({
    where: { workspaceId },
    orderBy: { order: 'asc' },
  });

  return clauses.map(formatClause);
}

/**
 * Get all variables bound to a clause
 */
export async function getVariablesForClause(
  clauseId: string,
  userId: string
): Promise<VariableResponse[]> {
  const clause = await prisma.clause.findUnique({
    where: { id: clauseId },
    select: { workspaceId: true },
  });

  if (!clause) {
    return [];
  }

  // Verify user has access to workspace
  const membership = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId: clause.workspaceId,
      userId,
      status: 'active',
    },
  });

  if (!membership) {
    return [];
  }

  const variables = await prisma.variable.findMany({
    where: { clauseId },
  });

  return variables.map(formatVariable);
}

/**
 * Get all variables for a workspace
 */
export async function getVariablesForWorkspace(
  workspaceId: string,
  userId: string
): Promise<VariableResponse[]> {
  // Verify user has access to workspace
  const membership = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId,
      userId,
      status: 'active',
    },
  });

  if (!membership) {
    return [];
  }

  const variables = await prisma.variable.findMany({
    where: { workspaceId },
  });

  return variables.map(formatVariable);
}

/**
 * Update clause text
 * Updates lastModifiedAt timestamp
 * Sensitive clause edits require reason parameter
 */
export async function updateClauseText(
  input: UpdateClauseTextInput,
  actorId: string,
  actorName: string
): Promise<UpdateClauseTextResult> {
  // Validate inputs
  if (!input.clauseId) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Clause ID is required',
      },
    };
  }

  if (input.newBody === undefined || input.newBody === null) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'New body is required',
      },
    };
  }

  // Get the clause
  const clause = await prisma.clause.findUnique({
    where: { id: input.clauseId },
  });

  if (!clause) {
    return {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Clause not found',
      },
    };
  }

  // Verify user has access to workspace
  const membership = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId: clause.workspaceId,
      userId: actorId,
      status: 'active',
    },
  });

  if (!membership) {
    return {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied to this workspace',
      },
    };
  }

  // Check if clause is locked
  if (clause.isLocked) {
    return {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Clause is locked and cannot be edited',
      },
    };
  }

  // Sensitive clauses require a reason
  if (clause.isSensitive && !input.reason) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Reason is required for editing sensitive clauses',
      },
    };
  }

  const now = new Date();
  const oldBody = clause.body;

  // Update clause and create audit event in a transaction
  const [updatedClause] = await prisma.$transaction([
    prisma.clause.update({
      where: { id: input.clauseId },
      data: {
        body: input.newBody,
        lastModifiedAt: now,
        lastModifiedBy: actorId,
      },
    }),
    prisma.auditEvent.create({
      data: {
        workspaceId: clause.workspaceId,
        timestamp: now,
        actorId,
        actorName,
        eventType: 'CLAUSE_EDIT',
        targetType: 'clause',
        targetId: clause.id,
        beforeState: JSON.stringify({ body: oldBody }),
        afterState: JSON.stringify({ body: input.newBody }),
        reason: input.reason,
        reasonCategory: input.reasonCategory,
      },
    }),
  ]);

  return {
    success: true,
    clause: formatClause(updatedClause),
  };
}

/**
 * Bind a variable to a clause
 * Captures variable label, type, value, and unit
 * Logs VARIABLE_BIND audit event
 */
export async function bindVariable(
  input: BindVariableInput,
  actorId: string,
  actorName: string
): Promise<BindVariableResult> {
  // Validate inputs
  if (!input.workspaceId) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Workspace ID is required',
      },
    };
  }

  if (!input.clauseId) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Clause ID is required',
      },
    };
  }

  if (!input.label || !input.label.trim()) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Variable label is required',
      },
    };
  }

  if (!input.type) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Variable type is required',
      },
    };
  }

  if (input.value === undefined || input.value === null) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Variable value is required',
      },
    };
  }

  // Verify user has access to workspace
  const membership = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId: input.workspaceId,
      userId: actorId,
      status: 'active',
    },
  });

  if (!membership) {
    return {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied to this workspace',
      },
    };
  }

  // Verify clause exists and belongs to workspace
  const clause = await prisma.clause.findUnique({
    where: { id: input.clauseId },
  });

  if (!clause) {
    return {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Clause not found',
      },
    };
  }

  if (clause.workspaceId !== input.workspaceId) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Clause does not belong to the specified workspace',
      },
    };
  }

  const now = new Date();

  // Create variable and audit event in a transaction
  const [variable] = await prisma.$transaction([
    prisma.variable.create({
      data: {
        workspaceId: input.workspaceId,
        clauseId: input.clauseId,
        label: input.label.trim(),
        type: input.type,
        value: input.value,
        unit: input.unit,
        baselineValue: input.baselineValue || input.value,
        createdAt: now,
        lastModifiedAt: now,
        lastModifiedBy: actorId,
      },
    }),
    prisma.auditEvent.create({
      data: {
        workspaceId: input.workspaceId,
        timestamp: now,
        actorId,
        actorName,
        eventType: 'VARIABLE_BIND',
        targetType: 'variable',
        targetId: '', // Will be updated after creation
        afterState: JSON.stringify({
          label: input.label.trim(),
          type: input.type,
          value: input.value,
          unit: input.unit,
          clauseId: input.clauseId,
        }),
      },
    }),
  ]);

  // Update audit event with correct targetId
  await prisma.auditEvent.updateMany({
    where: {
      workspaceId: input.workspaceId,
      actorId,
      eventType: 'VARIABLE_BIND',
      targetId: '',
      timestamp: now,
    },
    data: {
      targetId: variable.id,
    },
  });

  return {
    success: true,
    variable: formatVariable(variable),
  };
}

/**
 * Update an existing variable
 * Logs VARIABLE_EDIT audit event
 */
export async function updateVariable(
  variableId: string,
  updates: UpdateVariableInput,
  actorId: string,
  actorName: string
): Promise<UpdateVariableResult> {
  if (!variableId) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Variable ID is required',
      },
    };
  }

  // Get the variable
  const variable = await prisma.variable.findUnique({
    where: { id: variableId },
  });

  if (!variable) {
    return {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Variable not found',
      },
    };
  }

  // Verify user has access to workspace
  const membership = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId: variable.workspaceId,
      userId: actorId,
      status: 'active',
    },
  });

  if (!membership) {
    return {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied to this workspace',
      },
    };
  }

  const now = new Date();
  const beforeState = {
    label: variable.label,
    type: variable.type,
    value: variable.value,
    unit: variable.unit,
  };

  // Build update data
  const updateData: any = {
    lastModifiedAt: now,
    lastModifiedBy: actorId,
  };

  if (updates.label !== undefined) updateData.label = updates.label;
  if (updates.type !== undefined) updateData.type = updates.type;
  if (updates.value !== undefined) updateData.value = updates.value;
  if (updates.unit !== undefined) updateData.unit = updates.unit;

  // Update variable and create audit event in a transaction
  const [updatedVariable] = await prisma.$transaction([
    prisma.variable.update({
      where: { id: variableId },
      data: updateData,
    }),
    prisma.auditEvent.create({
      data: {
        workspaceId: variable.workspaceId,
        timestamp: now,
        actorId,
        actorName,
        eventType: 'VARIABLE_EDIT',
        targetType: 'variable',
        targetId: variableId,
        beforeState: JSON.stringify(beforeState),
        afterState: JSON.stringify({
          label: updates.label ?? variable.label,
          type: updates.type ?? variable.type,
          value: updates.value ?? variable.value,
          unit: updates.unit ?? variable.unit,
        }),
      },
    }),
  ]);

  return {
    success: true,
    variable: formatVariable(updatedVariable),
  };
}

/**
 * Sync document to graph
 * Recomputes graph nodes/edges and drift detection
 */
export async function syncToGraph(
  workspaceId: string,
  actorId: string,
  actorName: string
): Promise<SyncToGraphResult> {
  if (!workspaceId) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Workspace ID is required',
      },
    };
  }

  // Verify workspace exists
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });

  if (!workspace) {
    return {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Workspace not found',
      },
    };
  }

  // Verify user has access to workspace
  const membership = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId,
      userId: actorId,
      status: 'active',
    },
  });

  if (!membership) {
    return {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied to this workspace',
      },
    };
  }

  const now = new Date();

  // Get all clauses and variables for the workspace
  const clauses = await prisma.clause.findMany({
    where: { workspaceId },
    include: { variables: true },
  });

  // Delete existing graph data for this workspace
  await prisma.$transaction([
    prisma.graphEdge.deleteMany({ where: { workspaceId } }),
    prisma.graphNode.deleteMany({ where: { workspaceId } }),
  ]);

  // Create graph nodes from clauses and variables
  const nodePromises: Promise<any>[] = [];
  const nodeMap = new Map<string, string>(); // Maps clauseId/variableId to nodeId

  for (const clause of clauses) {
    // Create node for clause
    const clauseNodePromise = prisma.graphNode.create({
      data: {
        workspaceId,
        label: clause.title,
        type: clause.type as any, // ClauseType maps to NodeType
        clauseId: clause.id,
        value: clause.body.substring(0, 100), // Preview
        hasDrift: false,
        hasWarning: false,
      },
    });
    nodePromises.push(clauseNodePromise);

    // Create nodes for variables
    for (const variable of clause.variables) {
      const variableNodePromise = prisma.graphNode.create({
        data: {
          workspaceId,
          label: variable.label,
          type: variable.type as any, // VariableType maps to NodeType
          clauseId: clause.id,
          variableId: variable.id,
          value: variable.value,
          hasDrift: variable.value !== variable.baselineValue,
          hasWarning: false,
        },
      });
      nodePromises.push(variableNodePromise);
    }
  }

  const nodes = await Promise.all(nodePromises);

  // Build node map for edge creation
  for (const node of nodes) {
    if (node.clauseId && !node.variableId) {
      nodeMap.set(`clause:${node.clauseId}`, node.id);
    } else if (node.variableId) {
      nodeMap.set(`variable:${node.variableId}`, node.id);
    }
  }

  // Create edges: connect variables to their parent clauses
  const edgePromises: Promise<any>[] = [];
  for (const clause of clauses) {
    const clauseNodeId = nodeMap.get(`clause:${clause.id}`);
    if (!clauseNodeId) continue;

    for (const variable of clause.variables) {
      const variableNodeId = nodeMap.get(`variable:${variable.id}`);
      if (!variableNodeId) continue;

      edgePromises.push(
        prisma.graphEdge.create({
          data: {
            workspaceId,
            sourceId: clauseNodeId,
            targetId: variableNodeId,
            weight: 1,
          },
        })
      );
    }
  }

  const edges = await Promise.all(edgePromises);

  // Count drift items
  const driftCount = await prisma.driftItem.count({
    where: {
      workspaceId,
      status: 'unresolved',
    },
  });

  // Calculate integrity score (simple: 1 - (drift / total variables))
  const totalVariables = await prisma.variable.count({ where: { workspaceId } });
  const driftingVariables = nodes.filter((n) => n.hasDrift).length;
  const integrityScore = totalVariables > 0 
    ? Math.max(0, 1 - (driftingVariables / totalVariables)) 
    : 1;

  // Update or create graph state
  await prisma.graphState.upsert({
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
  await prisma.workspace.update({
    where: { id: workspaceId },
    data: { lastSyncAt: now },
  });

  // Create audit event
  await prisma.auditEvent.create({
    data: {
      workspaceId,
      timestamp: now,
      actorId,
      actorName,
      eventType: 'GRAPH_SYNC',
      targetType: 'workspace',
      targetId: workspaceId,
      afterState: JSON.stringify({
        integrityScore,
        nodeCount: nodes.length,
        edgeCount: edges.length,
      }),
    },
  });

  return {
    success: true,
    integrityScore,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    driftCount,
  };
}

/**
 * Lock a clause (prevent edits)
 */
export async function lockClause(
  clauseId: string,
  actorId: string,
  actorName: string
): Promise<{ success: boolean; clause?: ClauseResponse; error?: ServiceError }> {
  const clause = await prisma.clause.findUnique({
    where: { id: clauseId },
  });

  if (!clause) {
    return {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Clause not found',
      },
    };
  }

  // Verify user has access to workspace
  const membership = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId: clause.workspaceId,
      userId: actorId,
      status: 'active',
    },
  });

  if (!membership) {
    return {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied to this workspace',
      },
    };
  }

  const now = new Date();

  const [updatedClause] = await prisma.$transaction([
    prisma.clause.update({
      where: { id: clauseId },
      data: {
        isLocked: true,
        lockedBy: actorId,
        lockedAt: now,
      },
    }),
    prisma.auditEvent.create({
      data: {
        workspaceId: clause.workspaceId,
        timestamp: now,
        actorId,
        actorName,
        eventType: 'SECTION_LOCKED',
        targetType: 'clause',
        targetId: clauseId,
        afterState: JSON.stringify({ isLocked: true }),
      },
    }),
  ]);

  return {
    success: true,
    clause: formatClause(updatedClause),
  };
}

/**
 * Unlock a clause (allow edits)
 */
export async function unlockClause(
  clauseId: string,
  actorId: string,
  actorName: string
): Promise<{ success: boolean; clause?: ClauseResponse; error?: ServiceError }> {
  const clause = await prisma.clause.findUnique({
    where: { id: clauseId },
  });

  if (!clause) {
    return {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Clause not found',
      },
    };
  }

  // Verify user has access to workspace
  const membership = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId: clause.workspaceId,
      userId: actorId,
      status: 'active',
    },
  });

  if (!membership) {
    return {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied to this workspace',
      },
    };
  }

  const now = new Date();

  const [updatedClause] = await prisma.$transaction([
    prisma.clause.update({
      where: { id: clauseId },
      data: {
        isLocked: false,
        lockedBy: null,
        lockedAt: null,
      },
    }),
    prisma.auditEvent.create({
      data: {
        workspaceId: clause.workspaceId,
        timestamp: now,
        actorId,
        actorName,
        eventType: 'SECTION_UNLOCKED',
        targetType: 'clause',
        targetId: clauseId,
        afterState: JSON.stringify({ isLocked: false }),
      },
    }),
  ]);

  return {
    success: true,
    clause: formatClause(updatedClause),
  };
}

/**
 * Delete a variable
 */
export async function deleteVariable(
  variableId: string,
  actorId: string,
  actorName: string
): Promise<{ success: boolean; error?: ServiceError }> {
  const variable = await prisma.variable.findUnique({
    where: { id: variableId },
  });

  if (!variable) {
    return {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Variable not found',
      },
    };
  }

  // Verify user has access to workspace
  const membership = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId: variable.workspaceId,
      userId: actorId,
      status: 'active',
    },
  });

  if (!membership) {
    return {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied to this workspace',
      },
    };
  }

  const now = new Date();

  await prisma.$transaction([
    prisma.variable.delete({
      where: { id: variableId },
    }),
    prisma.auditEvent.create({
      data: {
        workspaceId: variable.workspaceId,
        timestamp: now,
        actorId,
        actorName,
        eventType: 'VARIABLE_EDIT',
        targetType: 'variable',
        targetId: variableId,
        beforeState: JSON.stringify({
          label: variable.label,
          type: variable.type,
          value: variable.value,
          unit: variable.unit,
        }),
        reason: 'Variable deleted',
      },
    }),
  ]);

  return { success: true };
}
