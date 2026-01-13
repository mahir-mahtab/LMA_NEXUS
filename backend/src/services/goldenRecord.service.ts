import { prisma } from '../index.js';
import { AuditEventType, ConnectorStatus, ConnectorType, GoldenRecordStatus, ReasonCategory, DriftSeverity, DriftStatus } from '@prisma/client';

// ============================================
// TYPES
// ============================================

export interface DownstreamConnectorResponse {
  id: string;
  name: string;
  type: ConnectorType;
  status: ConnectorStatus;
  lastSyncAt: string | null;
}

export interface CovenantResponse {
  id: string;
  workspaceId: string;
  name: string;
  testFrequency: string;
  threshold: string;
  calculationBasis: string;
  clauseId: string;
}

export interface GoldenRecordResponse {
  workspaceId: string;
  status: GoldenRecordStatus;
  integrityScore: number;
  unresolvedHighDriftCount: number;
  lastExportAt: string | null;
  lastPublishAt: string | null;
  connectors: DownstreamConnectorResponse[];
  covenants: CovenantResponse[];
  schemaJson: string;
}

export interface ServiceError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface GetGoldenRecordResult {
  success: boolean;
  goldenRecord?: GoldenRecordResponse;
  error?: ServiceError;
}

export interface ExportSchemaResult {
  success: boolean;
  schemaJson?: string;
  filename?: string;
  error?: ServiceError;
}

export interface PublishResult {
  success: boolean;
  goldenRecord?: GoldenRecordResponse;
  error?: ServiceError;
}

export interface CanPublishResult {
  allowed: boolean;
  reason?: string;
  integrityScore: number;
  unresolvedHighDriftCount: number;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatConnector(connector: any): DownstreamConnectorResponse {
  return {
    id: connector.id,
    name: connector.name,
    type: connector.type,
    status: connector.status,
    lastSyncAt: connector.lastSyncAt?.toISOString() || null,
  };
}

function formatCovenant(covenant: any): CovenantResponse {
  return {
    id: covenant.id,
    workspaceId: covenant.workspaceId,
    name: covenant.name,
    testFrequency: covenant.testFrequency,
    threshold: covenant.threshold,
    calculationBasis: covenant.calculationBasis,
    clauseId: covenant.clauseId,
  };
}

/**
 * Get default downstream connectors for a workspace
 */
function getDefaultConnectors(workspaceId: string): DownstreamConnectorResponse[] {
  return [
    {
      id: `connector-loaniq-${workspaceId}`,
      name: 'LoanIQ',
      type: ConnectorType.LoanIQ,
      status: ConnectorStatus.DISCONNECTED,
      lastSyncAt: null,
    },
    {
      id: `connector-finastra-${workspaceId}`,
      name: 'Finastra',
      type: ConnectorType.Finastra,
      status: ConnectorStatus.DISCONNECTED,
      lastSyncAt: null,
    },
    {
      id: `connector-allvue-${workspaceId}`,
      name: 'Allvue',
      type: ConnectorType.Allvue,
      status: ConnectorStatus.DISCONNECTED,
      lastSyncAt: null,
    },
    {
      id: `connector-covenant-${workspaceId}`,
      name: 'CovenantTracker',
      type: ConnectorType.CovenantTracker,
      status: ConnectorStatus.DISCONNECTED,
      lastSyncAt: null,
    },
  ];
}

/**
 * Calculate integrity score based on graph state
 */
async function calculateIntegrityScore(workspaceId: string): Promise<number> {
  const nodes = await prisma.graphNode.findMany({
    where: { workspaceId },
  });

  if (nodes.length === 0) {
    return 100; // No nodes = perfect integrity (nothing to check)
  }

  const nodesWithDrift = nodes.filter((n) => n.hasDrift).length;
  const nodesWithWarning = nodes.filter((n) => n.hasWarning).length;

  // Integrity score: 100% minus penalties for drift and warnings
  const driftPenalty = (nodesWithDrift / nodes.length) * 30;
  const warningPenalty = (nodesWithWarning / nodes.length) * 20;

  return Math.max(0, Math.round(100 - driftPenalty - warningPenalty));
}

/**
 * Get count of unresolved HIGH severity drift
 */
async function getUnresolvedHighDriftCountInternal(workspaceId: string): Promise<number> {
  return await prisma.driftItem.count({
    where: {
      workspaceId,
      status: DriftStatus.unresolved,
      severity: DriftSeverity.HIGH,
    },
  });
}

/**
 * Compute golden record status
 * Status is READY if integrityScore >= 90 AND unresolvedHighDriftCount == 0
 */
function computeStatus(
  integrityScore: number,
  unresolvedHighDriftCount: number
): GoldenRecordStatus {
  if (integrityScore >= 90 && unresolvedHighDriftCount === 0) {
    return GoldenRecordStatus.READY;
  }
  return GoldenRecordStatus.IN_REVIEW;
}

/**
 * Generate schema JSON from workspace data
 */
async function generateSchemaJson(workspaceId: string): Promise<string> {
  const [workspace, clauses, variables, covenants] = await Promise.all([
    prisma.workspace.findUnique({ where: { id: workspaceId } }),
    prisma.clause.findMany({ where: { workspaceId }, orderBy: { order: 'asc' } }),
    prisma.variable.findMany({ where: { workspaceId } }),
    prisma.covenant.findMany({ where: { workspaceId } }),
  ]);

  const schema = {
    version: '1.0',
    generatedAt: new Date().toISOString(),
    workspace: workspace
      ? {
          id: workspace.id,
          name: workspace.name,
          currency: workspace.currency,
          amount: workspace.amount,
          standard: workspace.standard,
        }
      : null,
    clauses: clauses.map((c) => ({
      id: c.id,
      title: c.title,
      type: c.type,
      order: c.order,
    })),
    variables: variables.map((v) => ({
      id: v.id,
      label: v.label,
      type: v.type,
      value: v.value,
      unit: v.unit,
      clauseId: v.clauseId,
    })),
    covenants: covenants.map((c) => ({
      id: c.id,
      name: c.name,
      testFrequency: c.testFrequency,
      threshold: c.threshold,
      calculationBasis: c.calculationBasis,
      clauseId: c.clauseId,
    })),
  };

  return JSON.stringify(schema, null, 2);
}

// ============================================
// SERVICE FUNCTIONS
// ============================================

/**
 * Get the golden record for a workspace
 * Computes status from integrityScore and unresolvedHighDriftCount
 * Requirements: 9.1
 */
export async function getGoldenRecord(
  workspaceId: string,
  userId: string
): Promise<GetGoldenRecordResult> {
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

    // Calculate current metrics
    const [integrityScore, unresolvedHighDriftCount, covenants, connectors, schemaJson] =
      await Promise.all([
        calculateIntegrityScore(workspaceId),
        getUnresolvedHighDriftCountInternal(workspaceId),
        prisma.covenant.findMany({ where: { workspaceId } }),
        prisma.downstreamConnector.findMany({ where: { workspaceId } }),
        generateSchemaJson(workspaceId),
      ]);

    const status = computeStatus(integrityScore, unresolvedHighDriftCount);

    // Get or create golden record
    let goldenRecord = await prisma.goldenRecord.findUnique({
      where: { workspaceId },
    });

    if (goldenRecord) {
      // Update existing golden record with current metrics
      goldenRecord = await prisma.goldenRecord.update({
        where: { workspaceId },
        data: {
          status,
          integrityScore,
          unresolvedHighDriftCount,
          schemaJson,
        },
      });
    } else {
      // Create new golden record
      goldenRecord = await prisma.goldenRecord.create({
        data: {
          workspaceId,
          status,
          integrityScore,
          unresolvedHighDriftCount,
          schemaJson,
        },
      });

      // Create default connectors if none exist
      if (connectors.length === 0) {
        const defaultConnectors = getDefaultConnectors(workspaceId);
        await prisma.downstreamConnector.createMany({
          data: defaultConnectors.map((c) => ({
            id: c.id,
            workspaceId,
            name: c.name,
            type: c.type,
            status: c.status,
          })),
        });
      }
    }

    // Get connectors again after potential creation
    const finalConnectors = await prisma.downstreamConnector.findMany({
      where: { workspaceId },
    });

    const response: GoldenRecordResponse = {
      workspaceId,
      status,
      integrityScore,
      unresolvedHighDriftCount,
      lastExportAt: goldenRecord.lastExportAt?.toISOString() || null,
      lastPublishAt: goldenRecord.lastPublishAt?.toISOString() || null,
      connectors:
        finalConnectors.length > 0
          ? finalConnectors.map(formatConnector)
          : getDefaultConnectors(workspaceId),
      covenants: covenants.map(formatCovenant),
      schemaJson,
    };

    return {
      success: true,
      goldenRecord: response,
    };
  } catch (error: any) {
    console.error('Error getting golden record:', error);
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get golden record',
        details: { error: error.message },
      },
    };
  }
}

/**
 * Export the golden record schema as JSON
 * Logs EXPORT_JSON audit event
 * Requirements: 9.2
 */
export async function exportSchema(
  workspaceId: string,
  actorId: string,
  actorName: string
): Promise<ExportSchemaResult> {
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

    if (!actorId || !actorName) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Actor information is required',
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

    const now = new Date();
    const schemaJson = await generateSchemaJson(workspaceId);
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    const filename = `golden_record_${workspace.name.replace(/\s+/g, '_')}_${timestamp}.json`;

    // Update golden record's lastExportAt
    await prisma.goldenRecord.upsert({
      where: { workspaceId },
      update: { lastExportAt: now },
      create: {
        workspaceId,
        status: GoldenRecordStatus.IN_REVIEW,
        integrityScore: 0,
        unresolvedHighDriftCount: 0,
        schemaJson,
        lastExportAt: now,
      },
    });

    // Create EXPORT_JSON audit event
    await prisma.auditEvent.create({
      data: {
        workspaceId,
        actorId,
        actorName,
        eventType: AuditEventType.EXPORT_JSON,
        targetType: 'golden_record',
        afterState: JSON.stringify({
          filename,
          size: schemaJson.length,
        }),
      },
    });

    return {
      success: true,
      schemaJson,
      filename,
    };
  } catch (error: any) {
    console.error('Error exporting schema:', error);
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to export schema',
        details: { error: error.message },
      },
    };
  }
}

/**
 * Publish the golden record to downstream systems
 * Blocked if status is IN_REVIEW
 * Logs PUBLISH audit event
 * Requirements: 9.3, 9.4
 */
export async function publish(
  workspaceId: string,
  reason: string,
  actorId: string,
  actorName: string,
  reasonCategory?: ReasonCategory
): Promise<PublishResult> {
  try {
    // Validate inputs
    if (!workspaceId) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Workspace ID is required',
        },
      };
    }

    if (!reason || !reason.trim()) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Reason is required for publishing',
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

    // Get current golden record state
    const result = await getGoldenRecord(workspaceId, actorId);
    if (!result.success || !result.goldenRecord) {
      return {
        success: false,
        error: result.error || {
          code: 'NOT_FOUND',
          message: 'Golden record not found',
        },
      };
    }

    const goldenRecord = result.goldenRecord;

    // Check if publish is blocked
    if (goldenRecord.status === GoldenRecordStatus.IN_REVIEW) {
      return {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message:
            'Cannot publish while status is IN_REVIEW. Resolve all HIGH severity drift and ensure integrity score is at least 90%.',
          details: {
            integrityScore: goldenRecord.integrityScore,
            unresolvedHighDriftCount: goldenRecord.unresolvedHighDriftCount,
          },
        },
      };
    }

    const now = new Date();

    // Update connector statuses to READY and update golden record
    await prisma.$transaction([
      // Update golden record
      prisma.goldenRecord.update({
        where: { workspaceId },
        data: { lastPublishAt: now },
      }),
      // Update all connectors to READY
      prisma.downstreamConnector.updateMany({
        where: { workspaceId },
        data: {
          status: ConnectorStatus.READY,
          lastSyncAt: now,
        },
      }),
      // Create PUBLISH audit event
      prisma.auditEvent.create({
        data: {
          workspaceId,
          actorId,
          actorName,
          eventType: AuditEventType.PUBLISH,
          targetType: 'golden_record',
          afterState: JSON.stringify({
            status: 'READY',
            integrityScore: goldenRecord.integrityScore,
            connectorCount: goldenRecord.connectors.length,
          }),
          reason: reason.trim(),
          reasonCategory: reasonCategory || null,
        },
      }),
    ]);

    // Get updated connectors
    const updatedConnectors = await prisma.downstreamConnector.findMany({
      where: { workspaceId },
    });

    const updatedGoldenRecord: GoldenRecordResponse = {
      ...goldenRecord,
      lastPublishAt: now.toISOString(),
      connectors: updatedConnectors.map(formatConnector),
    };

    return {
      success: true,
      goldenRecord: updatedGoldenRecord,
    };
  } catch (error: any) {
    console.error('Error publishing golden record:', error);
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to publish golden record',
        details: { error: error.message },
      },
    };
  }
}

/**
 * Get covenants for a workspace
 * Requirements: 9.5
 */
export async function getCovenants(
  workspaceId: string,
  userId: string
): Promise<CovenantResponse[]> {
  try {
    if (!workspaceId) {
      return [];
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
      return [];
    }

    const covenants = await prisma.covenant.findMany({
      where: { workspaceId },
    });

    return covenants.map(formatCovenant);
  } catch (error: any) {
    console.error('Error getting covenants:', error);
    return [];
  }
}

/**
 * Get downstream connectors for a workspace
 * Requirements: 9.6
 */
export async function getConnectors(
  workspaceId: string,
  userId: string
): Promise<DownstreamConnectorResponse[]> {
  try {
    if (!workspaceId) {
      return [];
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
      return [];
    }

    const connectors = await prisma.downstreamConnector.findMany({
      where: { workspaceId },
    });

    if (connectors.length === 0) {
      return getDefaultConnectors(workspaceId);
    }

    return connectors.map(formatConnector);
  } catch (error: any) {
    console.error('Error getting connectors:', error);
    return getDefaultConnectors(workspaceId);
  }
}

/**
 * Test connection to a downstream system
 */
export async function testConnection(
  connectorId: string,
  userId: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Get connector to verify it exists
    const connector = await prisma.downstreamConnector.findUnique({
      where: { id: connectorId },
    });

    if (!connector) {
      return {
        success: false,
        message: 'Connector not found',
      };
    }

    // Verify user has access to workspace
    const member = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: connector.workspaceId,
        },
      },
    });

    if (!member) {
      return {
        success: false,
        message: 'Access denied',
      };
    }

    // Simulate connection test (80% success rate)
    const success = Math.random() > 0.2;

    return {
      success,
      message: success
        ? 'Connection successful'
        : 'Connection failed: Unable to reach endpoint',
    };
  } catch (error: any) {
    console.error('Error testing connection:', error);
    return {
      success: false,
      message: 'Connection test failed',
    };
  }
}

/**
 * Check if publishing is allowed
 * Requirements: 9.4
 */
export async function canPublish(
  workspaceId: string,
  userId: string
): Promise<CanPublishResult> {
  try {
    const result = await getGoldenRecord(workspaceId, userId);

    if (!result.success || !result.goldenRecord) {
      return {
        allowed: false,
        reason: 'Golden record not found',
        integrityScore: 0,
        unresolvedHighDriftCount: 0,
      };
    }

    const { integrityScore, unresolvedHighDriftCount, status } = result.goldenRecord;

    if (status === GoldenRecordStatus.IN_REVIEW) {
      const reasons: string[] = [];
      if (integrityScore < 90) {
        reasons.push(`Integrity score (${integrityScore}%) is below 90%`);
      }
      if (unresolvedHighDriftCount > 0) {
        reasons.push(`${unresolvedHighDriftCount} unresolved HIGH severity drift item(s)`);
      }

      return {
        allowed: false,
        reason: reasons.join('. '),
        integrityScore,
        unresolvedHighDriftCount,
      };
    }

    return {
      allowed: true,
      integrityScore,
      unresolvedHighDriftCount,
    };
  } catch (error: any) {
    console.error('Error checking can publish:', error);
    return {
      allowed: false,
      reason: 'Failed to check publish status',
      integrityScore: 0,
      unresolvedHighDriftCount: 0,
    };
  }
}
