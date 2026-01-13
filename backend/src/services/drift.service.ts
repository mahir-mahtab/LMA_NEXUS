import { prisma } from '../index.js';
import { AuditEventType, ClauseType, DriftSeverity, DriftStatus, ReasonCategory } from '@prisma/client';

// ============================================
// TYPES
// ============================================

export interface DriftItemResponse {
  id: string;
  workspaceId: string;
  clauseId: string;
  variableId: string | null;
  title: string;
  type: ClauseType;
  severity: DriftSeverity;
  baselineValue: string;
  baselineApprovedAt: string;
  currentValue: string;
  currentModifiedAt: string;
  currentModifiedBy: string;
  status: DriftStatus;
  approvedBy: string | null;
  approvedAt: string | null;
  approvalReason: string | null;
}

export interface ServiceError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ListDriftFilter {
  workspaceId: string;
  severity?: DriftSeverity;
  type?: ClauseType;
  status?: DriftStatus;
  keyword?: string;
}

export interface OverrideBaselineInput {
  driftId: string;
  reason: string;
  reasonCategory?: ReasonCategory;
}

export interface OverrideBaselineResult {
  success: boolean;
  drift?: DriftItemResponse;
  error?: ServiceError;
}

export interface RevertDraftInput {
  driftId: string;
  reason: string;
  reasonCategory?: ReasonCategory;
}

export interface RevertDraftResult {
  success: boolean;
  drift?: DriftItemResponse;
  error?: ServiceError;
}

export interface RecomputeDriftResult {
  success: boolean;
  driftCount?: number;
  error?: ServiceError;
}

export interface ApproveDriftResult {
  success: boolean;
  drift?: DriftItemResponse;
  error?: ServiceError;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatDriftItem(item: any): DriftItemResponse {
  return {
    id: item.id,
    workspaceId: item.workspaceId,
    clauseId: item.clauseId,
    variableId: item.variableId,
    title: item.title,
    type: item.type,
    severity: item.severity,
    baselineValue: item.baselineValue,
    baselineApprovedAt: item.baselineApprovedAt.toISOString(),
    currentValue: item.currentValue,
    currentModifiedAt: item.currentModifiedAt.toISOString(),
    currentModifiedBy: item.currentModifiedBy,
    status: item.status,
    approvedBy: item.approvedBy,
    approvedAt: item.approvedAt?.toISOString() || null,
    approvalReason: item.approvalReason,
  };
}

/**
 * Calculate drift severity based on value change
 */
function calculateSeverity(
  baselineValue: string,
  currentValue: string,
  type: ClauseType
): DriftSeverity {
  // For financial and covenant types, try to calculate percentage change
  const baseNum = parseFloat(baselineValue.replace(/[^0-9.-]/g, ''));
  const currNum = parseFloat(currentValue.replace(/[^0-9.-]/g, ''));

  if (!isNaN(baseNum) && !isNaN(currNum) && baseNum !== 0) {
    const percentChange = Math.abs((currNum - baseNum) / baseNum) * 100;
    
    if (type === ClauseType.covenant || type === ClauseType.financial) {
      if (percentChange >= 10) return DriftSeverity.HIGH;
      if (percentChange >= 5) return DriftSeverity.MEDIUM;
      return DriftSeverity.LOW;
    }
  }

  // For definitions or non-numeric values, any change is at least MEDIUM
  if (type === ClauseType.definition) {
    return DriftSeverity.MEDIUM;
  }

  // Default to LOW for other types
  return DriftSeverity.LOW;
}

// ============================================
// SERVICE FUNCTIONS
// ============================================

/**
 * List drift items with optional filtering
 * Requirements: 7.1, 7.5
 */
export async function listDrift(
  filter: ListDriftFilter,
  userId: string
): Promise<DriftItemResponse[]> {
  try {
    // Verify user has access to workspace
    const member = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: filter.workspaceId,
        },
      },
    });

    if (!member) {
      return [];
    }

    // Build where clause
    const where: any = {
      workspaceId: filter.workspaceId,
    };

    if (filter.severity) {
      where.severity = filter.severity;
    }

    if (filter.type) {
      where.type = filter.type;
    }

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.keyword) {
      where.OR = [
        { title: { contains: filter.keyword, mode: 'insensitive' } },
        { baselineValue: { contains: filter.keyword, mode: 'insensitive' } },
        { currentValue: { contains: filter.keyword, mode: 'insensitive' } },
      ];
    }

    const driftItems = await prisma.driftItem.findMany({
      where,
      orderBy: [
        // Sort by severity (HIGH first)
        { severity: 'asc' }, // In Prisma enum, order is based on declaration: HIGH=0, MEDIUM=1, LOW=2
        // Then by modification date (newest first)
        { currentModifiedAt: 'desc' },
      ],
    });

    return driftItems.map(formatDriftItem);
  } catch (error: any) {
    console.error('Error listing drift items:', error);
    return [];
  }
}

/**
 * Get a single drift item by ID
 */
export async function getDrift(
  driftId: string,
  userId: string
): Promise<DriftItemResponse | null> {
  try {
    const drift = await prisma.driftItem.findUnique({
      where: { id: driftId },
    });

    if (!drift) {
      return null;
    }

    // Verify user has access to workspace
    const member = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: drift.workspaceId,
        },
      },
    });

    if (!member) {
      return null;
    }

    return formatDriftItem(drift);
  } catch (error: any) {
    console.error('Error getting drift item:', error);
    return null;
  }
}

/**
 * Override baseline - sets baselineValue = currentValue
 * Logs DRIFT_OVERRIDE audit event
 * Requirements: 7.2
 */
export async function overrideBaseline(
  input: OverrideBaselineInput,
  actorId: string,
  actorName: string
): Promise<OverrideBaselineResult> {
  try {
    // Validate inputs
    if (!input.driftId) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Drift ID is required',
        },
      };
    }

    if (!input.reason || !input.reason.trim()) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Reason is required for baseline override',
        },
      };
    }

    if (!actorId || !actorName) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Actor information is required',
        },
      };
    }

    // Get drift item
    const drift = await prisma.driftItem.findUnique({
      where: { id: input.driftId },
    });

    if (!drift) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Drift item not found',
        },
      };
    }

    // Verify user has access to workspace
    const member = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: actorId,
          workspaceId: drift.workspaceId,
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

    // Can only override unresolved drift
    if (drift.status !== DriftStatus.unresolved) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Cannot override drift with status: ${drift.status}`,
        },
      };
    }

    const now = new Date();
    const oldBaselineValue = drift.baselineValue;

    // Perform update in transaction
    const [updatedDrift] = await prisma.$transaction([
      // Update drift item
      prisma.driftItem.update({
        where: { id: input.driftId },
        data: {
          baselineValue: drift.currentValue,
          baselineApprovedAt: now,
          status: DriftStatus.overridden,
          approvedBy: actorId,
          approvedAt: now,
          approvalReason: input.reason.trim(),
        },
      }),
      // Update variable's baseline value if applicable
      ...(drift.variableId
        ? [
            prisma.variable.update({
              where: { id: drift.variableId },
              data: { baselineValue: drift.currentValue },
            }),
          ]
        : []),
      // Create DRIFT_OVERRIDE audit event
      prisma.auditEvent.create({
        data: {
          workspaceId: drift.workspaceId,
          actorId,
          actorName,
          eventType: AuditEventType.DRIFT_OVERRIDE,
          targetType: 'drift',
          targetId: drift.id,
          beforeState: JSON.stringify({
            baselineValue: oldBaselineValue,
            status: 'unresolved',
          }),
          afterState: JSON.stringify({
            baselineValue: drift.currentValue,
            status: 'overridden',
          }),
          reason: input.reason.trim(),
          reasonCategory: input.reasonCategory || null,
        },
      }),
    ]);

    return {
      success: true,
      drift: formatDriftItem(updatedDrift),
    };
  } catch (error: any) {
    console.error('Error overriding baseline:', error);
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to override baseline',
        details: { error: error.message },
      },
    };
  }
}

/**
 * Revert draft - sets currentValue = baselineValue
 * Updates clause text and logs DRIFT_REVERT audit event
 * Requirements: 7.4
 */
export async function revertDraft(
  input: RevertDraftInput,
  actorId: string,
  actorName: string
): Promise<RevertDraftResult> {
  try {
    // Validate inputs
    if (!input.driftId) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Drift ID is required',
        },
      };
    }

    if (!input.reason || !input.reason.trim()) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Reason is required for draft revert',
        },
      };
    }

    if (!actorId || !actorName) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Actor information is required',
        },
      };
    }

    // Get drift item
    const drift = await prisma.driftItem.findUnique({
      where: { id: input.driftId },
    });

    if (!drift) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Drift item not found',
        },
      };
    }

    // Verify user has access to workspace
    const member = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: actorId,
          workspaceId: drift.workspaceId,
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

    // Can only revert unresolved drift
    if (drift.status !== DriftStatus.unresolved) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Cannot revert drift with status: ${drift.status}`,
        },
      };
    }

    const now = new Date();
    const oldCurrentValue = drift.currentValue;

    // Perform update in transaction
    const [updatedDrift] = await prisma.$transaction([
      // Update drift item
      prisma.driftItem.update({
        where: { id: input.driftId },
        data: {
          currentValue: drift.baselineValue,
          currentModifiedAt: now,
          currentModifiedBy: actorId,
          status: DriftStatus.reverted,
          approvedBy: actorId,
          approvedAt: now,
          approvalReason: input.reason.trim(),
        },
      }),
      // Update variable's value if applicable
      ...(drift.variableId
        ? [
            prisma.variable.update({
              where: { id: drift.variableId },
              data: {
                value: drift.baselineValue,
                lastModifiedAt: now,
                lastModifiedBy: actorId,
              },
            }),
          ]
        : []),
      // Create DRIFT_REVERT audit event
      prisma.auditEvent.create({
        data: {
          workspaceId: drift.workspaceId,
          actorId,
          actorName,
          eventType: AuditEventType.DRIFT_REVERT,
          targetType: 'drift',
          targetId: drift.id,
          beforeState: JSON.stringify({
            currentValue: oldCurrentValue,
            status: 'unresolved',
          }),
          afterState: JSON.stringify({
            currentValue: drift.baselineValue,
            status: 'reverted',
          }),
          reason: input.reason.trim(),
          reasonCategory: input.reasonCategory || null,
        },
      }),
    ]);

    return {
      success: true,
      drift: formatDriftItem(updatedDrift),
    };
  } catch (error: any) {
    console.error('Error reverting draft:', error);
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to revert draft',
        details: { error: error.message },
      },
    };
  }
}

/**
 * Recompute drift items based on current variable values vs baselines
 * Requirements: 5.3, 7.1
 */
export async function recomputeDrift(
  workspaceId: string,
  actorId: string
): Promise<RecomputeDriftResult> {
  try {
    if (!workspaceId) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Workspace ID is required',
        },
      };
    }

    // Verify user has access to workspace
    const member = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: actorId,
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

    // Get variables and clauses for this workspace
    const [variables, clauses, existingDrift] = await Promise.all([
      prisma.variable.findMany({
        where: { workspaceId },
      }),
      prisma.clause.findMany({
        where: { workspaceId },
      }),
      prisma.driftItem.findMany({
        where: { workspaceId },
      }),
    ]);

    // Keep resolved drift, update unresolved
    const resolvedDrift = existingDrift.filter(
      (d) => d.status !== DriftStatus.unresolved
    );

    // Create new drift items for variables with drift
    const newDriftItems: any[] = [];
    const driftUpdates: any[] = [];

    for (const variable of variables) {
      // Skip if no baseline or values match
      if (!variable.baselineValue || variable.value === variable.baselineValue) {
        continue;
      }

      // Check if there's already a resolved drift for this variable
      const existingResolved = resolvedDrift.find(
        (d) => d.variableId === variable.id
      );
      if (existingResolved) {
        continue; // Don't recreate drift for resolved items
      }

      // Find the clause for this variable
      const clause = clauses.find((c) => c.id === variable.clauseId);
      if (!clause) continue;

      // Check if there's an existing unresolved drift for this variable
      const existingUnresolved = existingDrift.find(
        (d) => d.variableId === variable.id && d.status === DriftStatus.unresolved
      );

      if (existingUnresolved) {
        // Update existing drift item
        const severity = calculateSeverity(
          variable.baselineValue,
          variable.value,
          clause.type
        );

        driftUpdates.push(
          prisma.driftItem.update({
            where: { id: existingUnresolved.id },
            data: {
              currentValue: variable.value,
              currentModifiedAt: variable.lastModifiedAt,
              severity,
            },
          })
        );
      } else {
        // Create new drift item
        const severity = calculateSeverity(
          variable.baselineValue,
          variable.value,
          clause.type
        );

        newDriftItems.push({
          workspaceId,
          clauseId: clause.id,
          variableId: variable.id,
          title: `${variable.label} Change`,
          type: clause.type,
          severity,
          baselineValue: variable.baselineValue,
          baselineApprovedAt: workspace.createdAt,
          currentValue: variable.value,
          currentModifiedAt: variable.lastModifiedAt,
          currentModifiedBy: variable.lastModifiedBy || actorId,
          status: DriftStatus.unresolved,
        });
      }
    }

    // Execute all updates in transaction
    await prisma.$transaction([
      ...driftUpdates,
      ...(newDriftItems.length > 0
        ? [prisma.driftItem.createMany({ data: newDriftItems })]
        : []),
    ]);

    // Count total unresolved drift
    const unresolvedCount = await prisma.driftItem.count({
      where: {
        workspaceId,
        status: DriftStatus.unresolved,
      },
    });

    return {
      success: true,
      driftCount: unresolvedCount,
    };
  } catch (error: any) {
    console.error('Error recomputing drift:', error);
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to recompute drift',
        details: { error: error.message },
      },
    };
  }
}

/**
 * Get count of unresolved HIGH severity drift for a workspace
 * Used for Golden Record publish gating
 * Requirements: 7.7
 */
export async function getUnresolvedHighDriftCount(
  workspaceId: string,
  userId: string
): Promise<number> {
  try {
    if (!workspaceId) {
      return 0;
    }

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
      return 0;
    }

    return await prisma.driftItem.count({
      where: {
        workspaceId,
        status: DriftStatus.unresolved,
        severity: DriftSeverity.HIGH,
      },
    });
  } catch (error: any) {
    console.error('Error getting unresolved high drift count:', error);
    return 0;
  }
}

/**
 * Check if publishing is blocked due to HIGH drift
 * Requirements: 7.7
 */
export async function isPublishBlocked(
  workspaceId: string,
  userId: string
): Promise<boolean> {
  const highDriftCount = await getUnresolvedHighDriftCount(workspaceId, userId);
  return highDriftCount > 0;
}

/**
 * Approve a drift item (Risk/Credit role)
 * Requirements: 7.3, 7.8
 */
export async function approveDrift(
  driftId: string,
  reason: string,
  actorId: string,
  actorName: string
): Promise<ApproveDriftResult> {
  try {
    if (!driftId) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Drift ID is required',
        },
      };
    }

    if (!reason || !reason.trim()) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Reason is required for drift approval',
        },
      };
    }

    // Get drift item
    const drift = await prisma.driftItem.findUnique({
      where: { id: driftId },
    });

    if (!drift) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Drift item not found',
        },
      };
    }

    // Verify user has access to workspace
    const member = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: actorId,
          workspaceId: drift.workspaceId,
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

    const now = new Date();

    // Perform update in transaction
    const [updatedDrift] = await prisma.$transaction([
      // Update drift item
      prisma.driftItem.update({
        where: { id: driftId },
        data: {
          status: DriftStatus.approved,
          approvedBy: actorId,
          approvedAt: now,
          approvalReason: reason.trim(),
        },
      }),
      // Create DRIFT_APPROVE audit event
      prisma.auditEvent.create({
        data: {
          workspaceId: drift.workspaceId,
          actorId,
          actorName,
          eventType: AuditEventType.DRIFT_APPROVE,
          targetType: 'drift',
          targetId: drift.id,
          beforeState: JSON.stringify({ status: drift.status }),
          afterState: JSON.stringify({ status: 'approved' }),
          reason: reason.trim(),
        },
      }),
    ]);

    return {
      success: true,
      drift: formatDriftItem(updatedDrift),
    };
  } catch (error: any) {
    console.error('Error approving drift:', error);
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to approve drift',
        details: { error: error.message },
      },
    };
  }
}
