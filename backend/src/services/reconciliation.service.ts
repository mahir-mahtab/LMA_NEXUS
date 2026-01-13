import { prisma } from '../index.js';
import {
  AuditEventType,
  ConfidenceLevel,
  ReconciliationDecision,
  ReconciliationFileType,
  DriftSeverity,
  DriftStatus,
  ClauseType,
  ReasonCategory,
} from '@prisma/client';
import {
  parseReconciliationChanges,
  validateSuggestionReferences,
  ClauseWithVariables,
} from '../ai/reconciliationParser.js';
import { extractTextFromPdf } from '../utils/pdfParser.js';

// ============================================
// TYPES
// ============================================

export interface ReconciliationSessionResponse {
  id: string;
  workspaceId: string;
  fileName: string;
  fileType: ReconciliationFileType;
  uploadedAt: string;
  uploadedBy: string;
  totalItems: number;
  appliedCount: number;
  rejectedCount: number;
  pendingCount: number;
}

export interface ReconciliationItemResponse {
  id: string;
  workspaceId: string;
  sessionId: string;
  incomingSnippet: string;
  targetClauseId: string;
  targetVariableId: string | null;
  confidence: ConfidenceLevel;
  baselineValue: string;
  currentValue: string;
  proposedValue: string;
  decision: ReconciliationDecision;
  decisionReason: string | null;
  decidedBy: string | null;
  decidedAt: string | null;
}

export interface ServiceError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface UploadReconciliationInput {
  workspaceId: string;
  fileBuffer: Buffer;
  fileName: string;
  fileType: 'pdf' | 'docx';
}

export interface UploadReconciliationResult {
  success: boolean;
  session?: ReconciliationSessionResponse;
  items?: ReconciliationItemResponse[];
  error?: ServiceError;
}

export interface ApplyItemInput {
  itemId: string;
  reason?: string;
  reasonCategory?: ReasonCategory;
}

export interface ApplyItemResult {
  success: boolean;
  item?: ReconciliationItemResponse;
  driftCreated?: boolean;
  error?: ServiceError;
}

export interface RejectItemInput {
  itemId: string;
  reason?: string;
  reasonCategory?: ReasonCategory;
}

export interface RejectItemResult {
  success: boolean;
  item?: ReconciliationItemResponse;
  error?: ServiceError;
}

export interface ListSessionsResult {
  success: boolean;
  sessions?: ReconciliationSessionResponse[];
  error?: ServiceError;
}

export interface ListItemsResult {
  success: boolean;
  items?: ReconciliationItemResponse[];
  error?: ServiceError;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatSession(session: any): ReconciliationSessionResponse {
  return {
    id: session.id,
    workspaceId: session.workspaceId,
    fileName: session.fileName,
    fileType: session.fileType,
    uploadedAt: session.uploadedAt.toISOString(),
    uploadedBy: session.uploadedBy,
    totalItems: session.totalItems,
    appliedCount: session.appliedCount,
    rejectedCount: session.rejectedCount,
    pendingCount: session.pendingCount,
  };
}

function formatItem(item: any): ReconciliationItemResponse {
  return {
    id: item.id,
    workspaceId: item.workspaceId,
    sessionId: item.sessionId,
    incomingSnippet: item.incomingSnippet,
    targetClauseId: item.targetClauseId,
    targetVariableId: item.targetVariableId,
    confidence: item.confidence,
    baselineValue: item.baselineValue,
    currentValue: item.currentValue,
    proposedValue: item.proposedValue,
    decision: item.decision,
    decisionReason: item.decisionReason,
    decidedBy: item.decidedBy,
    decidedAt: item.decidedAt?.toISOString() || null,
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

  if (type === ClauseType.definition) {
    return DriftSeverity.MEDIUM;
  }

  return DriftSeverity.LOW;
}

/**
 * Extract text from uploaded file based on type
 */
async function extractTextFromFile(
  buffer: Buffer,
  fileType: 'pdf' | 'docx'
): Promise<string> {
  if (fileType === 'pdf') {
    return extractTextFromPdf(buffer);
  } else if (fileType === 'docx') {
    // For DOCX, we'll use a simple text extraction
    // In production, use mammoth or docx library
    // For now, treat buffer as raw text (placeholder)
    return buffer.toString('utf-8');
  }
  throw new Error(`Unsupported file type: ${fileType}`);
}

// ============================================
// SERVICE FUNCTIONS
// ============================================

/**
 * Upload a document and generate reconciliation suggestions using AI
 * Requirements: 8.1, 8.2
 */
export async function uploadAndReconcile(
  input: UploadReconciliationInput,
  actorId: string,
  actorName: string
): Promise<UploadReconciliationResult> {
  try {
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

    if (!input.fileBuffer || input.fileBuffer.length === 0) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'File is required',
        },
      };
    }

    if (!input.fileName) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'File name is required',
        },
      };
    }

    // Verify user has access to workspace
    const member = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: actorId,
          workspaceId: input.workspaceId,
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
      where: { id: input.workspaceId },
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

    // Extract text from uploaded file
    let incomingText: string;
    try {
      incomingText = await extractTextFromFile(input.fileBuffer, input.fileType);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'FILE_PARSE_ERROR',
          message: `Failed to parse ${input.fileType.toUpperCase()} file: ${error.message}`,
        },
      };
    }

    // Fetch current workspace clauses with variables
    const clauses = await prisma.clause.findMany({
      where: { workspaceId: input.workspaceId },
      include: { variables: true },
      orderBy: { order: 'asc' },
    });

    if (clauses.length === 0) {
      return {
        success: false,
        error: {
          code: 'NO_CLAUSES',
          message: 'Workspace has no clauses to reconcile against',
        },
      };
    }

    // Transform clauses for AI parser
    const clausesForAI: ClauseWithVariables[] = clauses.map((c) => ({
      id: c.id,
      title: c.title,
      body: c.body,
      type: c.type,
      order: c.order,
      variables: c.variables.map((v) => ({
        id: v.id,
        label: v.label,
        type: v.type,
        value: v.value,
        unit: v.unit,
        baselineValue: v.baselineValue,
      })),
    }));

    // Call AI to parse reconciliation changes
    let aiResult;
    try {
      aiResult = await parseReconciliationChanges({
        currentDocument: { clauses: clausesForAI },
        incomingDocument: {
          text: incomingText,
          fileName: input.fileName,
          fileType: input.fileType,
        },
      });
    } catch (error: any) {
      console.error('AI reconciliation error:', error);
      return {
        success: false,
        error: {
          code: 'AI_PARSE_ERROR',
          message: `AI failed to parse document: ${error.message}`,
        },
      };
    }

    // Validate that AI suggestions reference valid clause/variable IDs
    const validSuggestions = validateSuggestionReferences(
      aiResult.suggestions,
      clausesForAI
    );

    // Create session and items in transaction
    const fileTypeEnum =
      input.fileType === 'pdf'
        ? ReconciliationFileType.pdf
        : ReconciliationFileType.docx;

    const result = await prisma.$transaction(async (tx) => {
      // Create session
      const session = await tx.reconciliationSession.create({
        data: {
          workspaceId: input.workspaceId,
          fileName: input.fileName,
          fileType: fileTypeEnum,
          uploadedBy: actorId,
          totalItems: validSuggestions.length,
          pendingCount: validSuggestions.length,
          appliedCount: 0,
          rejectedCount: 0,
        },
      });

      // Create reconciliation items
      const items = await Promise.all(
        validSuggestions.map((suggestion) =>
          tx.reconciliationItem.create({
            data: {
              workspaceId: input.workspaceId,
              sessionId: session.id,
              incomingSnippet: suggestion.incomingSnippet,
              targetClauseId: suggestion.targetClauseId,
              targetVariableId: suggestion.targetVariableId || null,
              confidence: suggestion.confidence as ConfidenceLevel,
              baselineValue: suggestion.baselineValue,
              currentValue: suggestion.currentValue,
              proposedValue: suggestion.proposedValue,
              decision: ReconciliationDecision.pending,
            },
          })
        )
      );

      // Create audit event for upload
      await tx.auditEvent.create({
        data: {
          workspaceId: input.workspaceId,
          actorId,
          actorName,
          eventType: AuditEventType.RECON_APPLY, // Using closest available type
          targetType: 'reconciliation_session',
          targetId: session.id,
          afterState: JSON.stringify({
            fileName: input.fileName,
            totalItems: validSuggestions.length,
          }),
        },
      });

      return { session, items };
    });

    return {
      success: true,
      session: formatSession(result.session),
      items: result.items.map(formatItem),
    };
  } catch (error: any) {
    console.error('Error in uploadAndReconcile:', error);
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to process reconciliation',
        details: { error: error.message },
      },
    };
  }
}

/**
 * Apply a reconciliation suggestion
 * Updates the variable value and creates drift if needed
 * Requirements: 8.3
 */
export async function applyItem(
  input: ApplyItemInput,
  actorId: string,
  actorName: string
): Promise<ApplyItemResult> {
  try {
    if (!input.itemId) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Item ID is required',
        },
      };
    }

    // Get the reconciliation item
    const item = await prisma.reconciliationItem.findUnique({
      where: { id: input.itemId },
      include: {
        targetClause: true,
        targetVariable: true,
        session: true,
      },
    });

    if (!item) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Reconciliation item not found',
        },
      };
    }

    // Verify user has access
    const member = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: actorId,
          workspaceId: item.workspaceId,
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

    // Check if already decided
    if (item.decision !== ReconciliationDecision.pending) {
      return {
        success: false,
        error: {
          code: 'ALREADY_DECIDED',
          message: `Item has already been ${item.decision}`,
        },
      };
    }

    const now = new Date();
    let driftCreated = false;

    // Perform updates in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update the reconciliation item
      const updatedItem = await tx.reconciliationItem.update({
        where: { id: input.itemId },
        data: {
          decision: ReconciliationDecision.applied,
          decisionReason: input.reason || null,
          decidedBy: actorId,
          decidedAt: now,
        },
      });

      // Update session counters
      await tx.reconciliationSession.update({
        where: { id: item.sessionId },
        data: {
          appliedCount: { increment: 1 },
          pendingCount: { decrement: 1 },
        },
      });

      // If there's a target variable, update its value
      if (item.targetVariableId && item.targetVariable) {
        await tx.variable.update({
          where: { id: item.targetVariableId },
          data: {
            value: item.proposedValue,
            lastModifiedAt: now,
            lastModifiedBy: actorId,
          },
        });
      }

      // Check if this creates drift (proposed != baseline)
      // Handle both variable-level and clause-level reconciliation items
      const baselineValue = item.targetVariable?.baselineValue || 
                           item.targetVariable?.value || 
                           item.baselineValue;
      
      if (item.proposedValue !== baselineValue) {
        // Calculate severity
        const severity = calculateSeverity(
          baselineValue,
          item.proposedValue,
          item.targetClause.type
        );

        // Check if drift already exists
        // For variable-level: search by variableId
        // For clause-level: search by clauseId with NULL variableId
        const existingDrift = await tx.driftItem.findFirst({
          where: item.targetVariableId ? {
            variableId: item.targetVariableId,
            status: DriftStatus.unresolved,
          } : {
            clauseId: item.targetClauseId,
            variableId: null,
            status: DriftStatus.unresolved,
          },
        });

        if (existingDrift) {
          // Update existing drift
          await tx.driftItem.update({
            where: { id: existingDrift.id },
            data: {
              currentValue: item.proposedValue,
              currentModifiedAt: now,
              currentModifiedBy: actorId,
              severity,
            },
          });
        } else {
          // Create new drift item
          // Use workspace createdAt for more accurate baseline timestamp
          const workspace = await tx.workspace.findUnique({
            where: { id: item.workspaceId },
            select: { createdAt: true },
          });
          
          await tx.driftItem.create({
            data: {
              workspaceId: item.workspaceId,
              clauseId: item.targetClauseId,
              variableId: item.targetVariableId || null,
              title: item.targetVariable?.label 
                ? `${item.targetVariable.label} Change` 
                : `${item.targetClause.title} Change`,
              type: item.targetClause.type,
              severity,
              baselineValue: baselineValue,
              baselineApprovedAt: workspace?.createdAt || now,
              currentValue: item.proposedValue,
              currentModifiedAt: now,
              currentModifiedBy: actorId,
              status: DriftStatus.unresolved,
            },
          });
          driftCreated = true;
        }

        // Update graph node if exists
        if (item.targetVariableId) {
          // Variable-level graph node update
          await tx.graphNode.updateMany({
            where: { variableId: item.targetVariableId },
            data: {
              value: item.proposedValue,
              hasDrift: true,
            },
          });
        } else {
          // Clause-level graph node update (nodes without variables)
          await tx.graphNode.updateMany({
            where: { 
              clauseId: item.targetClauseId,
              variableId: null,
            },
            data: {
              hasDrift: true,
            },
          });
        }
      }

      // Create audit event
      await tx.auditEvent.create({
        data: {
          workspaceId: item.workspaceId,
          actorId,
          actorName,
          eventType: AuditEventType.RECON_APPLY,
          targetType: 'reconciliation_item',
          targetId: input.itemId,
          beforeState: JSON.stringify({
            value: item.currentValue,
            decision: 'pending',
          }),
          afterState: JSON.stringify({
            value: item.proposedValue,
            decision: 'applied',
          }),
          reason: input.reason || null,
          reasonCategory: input.reasonCategory || null,
        },
      });

      return updatedItem;
    });

    return {
      success: true,
      item: formatItem(result),
      driftCreated,
    };
  } catch (error: any) {
    console.error('Error applying reconciliation item:', error);
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to apply reconciliation item',
        details: { error: error.message },
      },
    };
  }
}

/**
 * Reject a reconciliation suggestion
 * Requirements: 8.4
 */
export async function rejectItem(
  input: RejectItemInput,
  actorId: string,
  actorName: string
): Promise<RejectItemResult> {
  try {
    if (!input.itemId) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Item ID is required',
        },
      };
    }

    // Get the reconciliation item
    const item = await prisma.reconciliationItem.findUnique({
      where: { id: input.itemId },
    });

    if (!item) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Reconciliation item not found',
        },
      };
    }

    // Verify user has access
    const member = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: actorId,
          workspaceId: item.workspaceId,
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

    // Check if already decided
    if (item.decision !== ReconciliationDecision.pending) {
      return {
        success: false,
        error: {
          code: 'ALREADY_DECIDED',
          message: `Item has already been ${item.decision}`,
        },
      };
    }

    const now = new Date();

    // Perform updates in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update the reconciliation item
      const updatedItem = await tx.reconciliationItem.update({
        where: { id: input.itemId },
        data: {
          decision: ReconciliationDecision.rejected,
          decisionReason: input.reason || null,
          decidedBy: actorId,
          decidedAt: now,
        },
      });

      // Update session counters
      await tx.reconciliationSession.update({
        where: { id: item.sessionId },
        data: {
          rejectedCount: { increment: 1 },
          pendingCount: { decrement: 1 },
        },
      });

      // Create audit event
      await tx.auditEvent.create({
        data: {
          workspaceId: item.workspaceId,
          actorId,
          actorName,
          eventType: AuditEventType.RECON_REJECT,
          targetType: 'reconciliation_item',
          targetId: input.itemId,
          beforeState: JSON.stringify({ decision: 'pending' }),
          afterState: JSON.stringify({ decision: 'rejected' }),
          reason: input.reason || null,
          reasonCategory: input.reasonCategory || null,
        },
      });

      return updatedItem;
    });

    return {
      success: true,
      item: formatItem(result),
    };
  } catch (error: any) {
    console.error('Error rejecting reconciliation item:', error);
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to reject reconciliation item',
        details: { error: error.message },
      },
    };
  }
}

/**
 * List reconciliation sessions for a workspace
 */
export async function listSessions(
  workspaceId: string,
  actorId: string
): Promise<ListSessionsResult> {
  try {
    // Verify user has access
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

    const sessions = await prisma.reconciliationSession.findMany({
      where: { workspaceId },
      orderBy: { uploadedAt: 'desc' },
    });

    return {
      success: true,
      sessions: sessions.map(formatSession),
    };
  } catch (error: any) {
    console.error('Error listing reconciliation sessions:', error);
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to list sessions',
        details: { error: error.message },
      },
    };
  }
}

/**
 * List reconciliation items for a session
 */
export async function listItems(
  sessionId: string,
  actorId: string,
  filter?: { decision?: ReconciliationDecision; confidence?: ConfidenceLevel }
): Promise<ListItemsResult> {
  try {
    // Get session to check access
    const session = await prisma.reconciliationSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Session not found',
        },
      };
    }

    // Verify user has access
    const member = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: actorId,
          workspaceId: session.workspaceId,
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

    // Build where clause
    const where: any = { sessionId };
    if (filter?.decision) {
      where.decision = filter.decision;
    }
    if (filter?.confidence) {
      where.confidence = filter.confidence;
    }

    const items = await prisma.reconciliationItem.findMany({
      where,
      orderBy: [{ confidence: 'asc' }, { createdAt: 'asc' }],
    });

    return {
      success: true,
      items: items.map(formatItem),
    };
  } catch (error: any) {
    console.error('Error listing reconciliation items:', error);
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to list items',
        details: { error: error.message },
      },
    };
  }
}

/**
 * Get a single reconciliation item by ID
 */
export async function getItem(
  itemId: string,
  actorId: string
): Promise<{ success: boolean; item?: ReconciliationItemResponse; error?: ServiceError }> {
  try {
    const item = await prisma.reconciliationItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Reconciliation item not found',
        },
      };
    }

    // Verify user has access
    const member = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: actorId,
          workspaceId: item.workspaceId,
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

    return {
      success: true,
      item: formatItem(item),
    };
  } catch (error: any) {
    console.error('Error getting reconciliation item:', error);
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get item',
        details: { error: error.message },
      },
    };
  }
}
