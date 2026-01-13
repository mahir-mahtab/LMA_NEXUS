import { Request, Response } from 'express';
import * as reconciliationService from '../services/reconciliation.service.js';
import { ConfidenceLevel, ReconciliationDecision, ReasonCategory } from '@prisma/client';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get authenticated user from request
 */
function getAuthUser(req: Request): { userId: string; userName: string } | null {
  const user = (req as any).user;
  if (!user || !user.id) {
    return null;
  }
  return {
    userId: user.id,
    userName: user.name || user.email || 'Unknown',
  };
}

// ============================================
// CONTROLLER FUNCTIONS
// ============================================

/**
 * Upload a document for reconciliation
 * POST /api/v1/reconciliations/upload
 */
export async function uploadDocument(req: Request, res: Response) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    const { workspaceId } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'File is required',
        },
      });
    }

    if (!workspaceId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Workspace ID is required',
        },
      });
    }

    // Determine file type from mimetype or extension
    let fileType: 'pdf' | 'docx';
    if (file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf')) {
      fileType = 'pdf';
    } else if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.originalname.endsWith('.docx')
    ) {
      fileType = 'docx';
    } else {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Unsupported file type. Only PDF and DOCX are supported.',
        },
      });
    }

    const result = await reconciliationService.uploadAndReconcile(
      {
        workspaceId,
        fileBuffer: file.buffer,
        fileName: file.originalname,
        fileType,
      },
      authUser.userId,
      authUser.userName
    );

    if (!result.success) {
      const statusCode = result.error?.code === 'FORBIDDEN' ? 403 : 
                        result.error?.code === 'NOT_FOUND' ? 404 : 400;
      return res.status(statusCode).json(result);
    }

    return res.status(201).json(result);
  } catch (error: any) {
    console.error('Error in uploadDocument:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
    });
  }
}

/**
 * List reconciliation sessions for a workspace
 * GET /api/v1/reconciliations/sessions?workspaceId=xxx
 */
export async function listSessions(req: Request, res: Response) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    const { workspaceId } = req.query;

    if (!workspaceId || typeof workspaceId !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Workspace ID is required',
        },
      });
    }

    const result = await reconciliationService.listSessions(
      workspaceId,
      authUser.userId
    );

    if (!result.success) {
      const statusCode = result.error?.code === 'FORBIDDEN' ? 403 : 400;
      return res.status(statusCode).json(result);
    }

    return res.json(result);
  } catch (error: any) {
    console.error('Error in listSessions:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
    });
  }
}

/**
 * List reconciliation items for a session
 * GET /api/v1/reconciliations/sessions/:sessionId/items
 */
export async function listItems(req: Request, res: Response) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    const { sessionId } = req.params;
    const { decision, confidence } = req.query;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Session ID is required',
        },
      });
    }

    // Build filter
    const filter: { decision?: ReconciliationDecision; confidence?: ConfidenceLevel } = {};
    if (decision && typeof decision === 'string') {
      filter.decision = decision as ReconciliationDecision;
    }
    if (confidence && typeof confidence === 'string') {
      filter.confidence = confidence as ConfidenceLevel;
    }

    const result = await reconciliationService.listItems(
      sessionId,
      authUser.userId,
      Object.keys(filter).length > 0 ? filter : undefined
    );

    if (!result.success) {
      const statusCode = result.error?.code === 'FORBIDDEN' ? 403 : 
                        result.error?.code === 'NOT_FOUND' ? 404 : 400;
      return res.status(statusCode).json(result);
    }

    return res.json(result);
  } catch (error: any) {
    console.error('Error in listItems:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
    });
  }
}

/**
 * Get a single reconciliation item
 * GET /api/v1/reconciliations/items/:itemId
 */
export async function getItem(req: Request, res: Response) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    const { itemId } = req.params;

    if (!itemId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Item ID is required',
        },
      });
    }

    const result = await reconciliationService.getItem(itemId, authUser.userId);

    if (!result.success) {
      const statusCode = result.error?.code === 'FORBIDDEN' ? 403 : 
                        result.error?.code === 'NOT_FOUND' ? 404 : 400;
      return res.status(statusCode).json(result);
    }

    return res.json(result);
  } catch (error: any) {
    console.error('Error in getItem:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
    });
  }
}

/**
 * Apply a reconciliation suggestion
 * POST /api/v1/reconciliations/items/:itemId/apply
 */
export async function applyItem(req: Request, res: Response) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    const { itemId } = req.params;
    const { reason, reasonCategory } = req.body;

    if (!itemId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Item ID is required',
        },
      });
    }

    const result = await reconciliationService.applyItem(
      {
        itemId,
        reason,
        reasonCategory: reasonCategory as ReasonCategory | undefined,
      },
      authUser.userId,
      authUser.userName
    );

    if (!result.success) {
      const statusCode = result.error?.code === 'FORBIDDEN' ? 403 : 
                        result.error?.code === 'NOT_FOUND' ? 404 :
                        result.error?.code === 'ALREADY_DECIDED' ? 409 : 400;
      return res.status(statusCode).json(result);
    }

    return res.json(result);
  } catch (error: any) {
    console.error('Error in applyItem:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
    });
  }
}

/**
 * Reject a reconciliation suggestion
 * POST /api/v1/reconciliations/items/:itemId/reject
 */
export async function rejectItem(req: Request, res: Response) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    const { itemId } = req.params;
    const { reason, reasonCategory } = req.body;

    if (!itemId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Item ID is required',
        },
      });
    }

    const result = await reconciliationService.rejectItem(
      {
        itemId,
        reason,
        reasonCategory: reasonCategory as ReasonCategory | undefined,
      },
      authUser.userId,
      authUser.userName
    );

    if (!result.success) {
      const statusCode = result.error?.code === 'FORBIDDEN' ? 403 : 
                        result.error?.code === 'NOT_FOUND' ? 404 :
                        result.error?.code === 'ALREADY_DECIDED' ? 409 : 400;
      return res.status(statusCode).json(result);
    }

    return res.json(result);
  } catch (error: any) {
    console.error('Error in rejectItem:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
    });
  }
}
