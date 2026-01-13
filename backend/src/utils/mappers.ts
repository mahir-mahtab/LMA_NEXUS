import type {
  AuditEventDTO,
  ClauseDTO,
  DriftItemDTO,
  GraphEdgeDTO,
  GraphNodeDTO,
  GraphStateDTO,
  ReconciliationItemDTO,
  ReconciliationSessionDTO,
  VariableDTO,
} from '../types/frontend.js';

// NOTE: We intentionally avoid importing Prisma types here so this file stays stable
// even if Prisma client paths change; callers can pass plain objects.

export function toIso(dt: Date | string | null | undefined): string | undefined {
  if (!dt) return undefined;
  return typeof dt === 'string' ? dt : dt.toISOString();
}

export function mapClause(clause: any): ClauseDTO {
  return {
    id: clause.id,
    workspaceId: clause.workspaceId,
    title: clause.title,
    body: clause.body,
    type: clause.type,
    order: clause.sortOrder,
    isSensitive: clause.isSensitive,
    isLocked: clause.isLocked,
    lockedBy: clause.lockedById ?? undefined,
    lockedAt: toIso(clause.lockedAt),
    lastModifiedAt: toIso(clause.lastModifiedAt)!,
    lastModifiedBy: clause.lastModifiedById,
  };
}

export function mapVariable(v: any): VariableDTO {
  return {
    id: v.id,
    workspaceId: v.workspaceId,
    clauseId: v.clauseId,
    label: v.label,
    type: v.type,
    value: v.value,
    unit: v.unit ?? undefined,
    baselineValue: v.baselineValue ?? undefined,
    createdAt: toIso(v.createdAt)!,
    lastModifiedAt: toIso(v.lastModifiedAt)!,
  };
}

export function mapGraphNode(n: any): GraphNodeDTO {
  return {
    id: n.id,
    workspaceId: n.workspaceId,
    label: n.label,
    type: n.type,
    clauseId: n.clauseId ?? undefined,
    variableId: n.variableId ?? undefined,
    value: n.value ?? undefined,
    hasDrift: Boolean(n.hasDrift),
    hasWarning: Boolean(n.hasWarning),
  };
}

export function mapGraphEdge(e: any): GraphEdgeDTO {
  return {
    id: e.id,
    workspaceId: e.workspaceId,
    sourceId: e.sourceId,
    targetId: e.targetId,
    weight: e.weight,
  };
}

export function mapGraphState(args: {
  nodes: any[];
  edges: any[];
  integrityScore: number;
  lastComputedAt: Date | string;
}): GraphStateDTO {
  return {
    nodes: args.nodes.map(mapGraphNode),
    edges: args.edges.map(mapGraphEdge),
    integrityScore: args.integrityScore,
    lastComputedAt: toIso(args.lastComputedAt)!,
  };
}

export function mapDriftItem(d: any): DriftItemDTO {
  return {
    id: d.id,
    workspaceId: d.workspaceId,
    clauseId: d.clauseId,
    variableId: d.variableId ?? undefined,
    title: d.title,
    type: d.type,
    severity: d.severity,
    baselineValue: d.baselineValue,
    baselineApprovedAt: toIso(d.baselineApprovedAt)!,
    currentValue: d.currentValue,
    currentModifiedAt: toIso(d.currentModifiedAt)!,
    currentModifiedBy: d.currentModifiedById,
    status: d.status,
    approvedBy: d.approvedById ?? undefined,
    approvedAt: toIso(d.approvedAt),
    approvalReason: d.approvalReason ?? undefined,
  };
}

export function mapReconciliationSession(s: any): ReconciliationSessionDTO {
  return {
    id: s.id,
    workspaceId: s.workspaceId,
    fileName: s.fileName,
    fileType: s.fileType,
    uploadedAt: toIso(s.uploadedAt)!,
    uploadedBy: s.uploadedById,
    totalItems: s.totalItems,
    appliedCount: s.appliedCount,
    rejectedCount: s.rejectedCount,
    pendingCount: s.pendingCount,
  };
}

export function mapReconciliationItem(i: any): ReconciliationItemDTO {
  return {
    id: i.id,
    workspaceId: i.workspaceId,
    sessionId: i.sessionId,
    incomingSnippet: i.incomingSnippet,
    targetClauseId: i.targetClauseId,
    targetVariableId: i.targetVariableId ?? undefined,
    confidence: i.confidence,
    baselineValue: i.baselineValue,
    currentValue: i.currentValue,
    proposedValue: i.proposedValue,
    decision: i.decision,
    decisionReason: i.decisionReason ?? undefined,
    decidedBy: i.decidedById ?? undefined,
    decidedAt: toIso(i.decidedAt),
  };
}

export function mapAuditEvent(e: any): AuditEventDTO {
  const actorName = e.actorName ?? e.actor?.name ?? e.actor?.email ?? 'Unknown';
  return {
    id: e.id,
    workspaceId: e.workspaceId ?? null,
    timestamp: toIso(e.timestamp)!,
    actorId: e.actorId,
    actorName,
    eventType: e.eventType,
    targetType: e.targetType ?? undefined,
    targetId: e.targetId ?? undefined,
    beforeState: e.beforeState ?? undefined,
    afterState: e.afterState ?? undefined,
    reason: e.reason ?? undefined,
    reasonCategory: e.reasonCategory ?? undefined,
  };
}
