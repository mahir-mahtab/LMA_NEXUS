import { Request, Response } from 'express';
import * as draftService from '../services/draft.service.js';
import { VariableType, ReasonCategory } from '@prisma/client';
import { prisma } from '../index.js';

/**
 * Get document outline for a workspace
 * GET /api/v1/workspaces/:id/outline
 */
export async function getDocumentOutline(req: Request, res: Response) {
  try {
    const workspaceId = req.params.id;
    const userId = req.user!.id;

    const outline = await draftService.getDocumentOutline(workspaceId, userId);

    res.json({ outline });
  } catch (error: any) {
    console.error('Error getting document outline:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get document outline',
      },
    });
  }
}

/**
 * Get all clauses for a workspace
 * GET /api/v1/workspaces/:id/clauses
 */
export async function getClausesForWorkspace(req: Request, res: Response) {
  try {
    const workspaceId = req.params.id;
    const userId = req.user!.id;

    const clauses = await draftService.getClausesForWorkspace(workspaceId, userId);

    res.json({ clauses });
  } catch (error: any) {
    console.error('Error getting clauses:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get clauses',
      },
    });
  }
}

/**
 * Get a single clause by ID
 * GET /api/v1/clauses/:clauseId
 */
export async function getClause(req: Request, res: Response) {
  try {
    const { clauseId } = req.params;
    const userId = req.user!.id;

    const clause = await draftService.getClause(clauseId, userId);

    if (!clause) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Clause not found or access denied',
        },
      });
    }

    res.json({ clause });
  } catch (error: any) {
    console.error('Error getting clause:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get clause',
      },
    });
  }
}

/**
 * Update clause text
 * PATCH /api/v1/clauses/:clauseId
 */
export async function updateClauseText(req: Request, res: Response) {
  try {
    const { clauseId } = req.params;
    const userId = req.user!.id;
    const { newBody, reason, reasonCategory } = req.body;

    // Get actor name
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    if (!user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not found',
        },
      });
    }

    const result = await draftService.updateClauseText(
      {
        clauseId,
        newBody,
        reason,
        reasonCategory: reasonCategory as ReasonCategory,
      },
      userId,
      user.name
    );

    if (!result.success) {
      const statusCode = result.error?.code === 'NOT_FOUND' ? 404 
        : result.error?.code === 'FORBIDDEN' ? 403 
        : result.error?.code === 'VALIDATION_ERROR' ? 400 
        : 500;
      return res.status(statusCode).json({ error: result.error });
    }

    res.json({ clause: result.clause });
  } catch (error: any) {
    console.error('Error updating clause:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update clause',
      },
    });
  }
}

/**
 * Lock a clause
 * POST /api/v1/clauses/:clauseId/lock
 */
export async function lockClause(req: Request, res: Response) {
  try {
    const { clauseId } = req.params;
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    if (!user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not found',
        },
      });
    }

    const result = await draftService.lockClause(clauseId, userId, user.name);

    if (!result.success) {
      const statusCode = result.error?.code === 'NOT_FOUND' ? 404 
        : result.error?.code === 'FORBIDDEN' ? 403 
        : 500;
      return res.status(statusCode).json({ error: result.error });
    }

    res.json({ clause: result.clause });
  } catch (error: any) {
    console.error('Error locking clause:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to lock clause',
      },
    });
  }
}

/**
 * Unlock a clause
 * DELETE /api/v1/clauses/:clauseId/lock
 */
export async function unlockClause(req: Request, res: Response) {
  try {
    const { clauseId } = req.params;
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    if (!user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not found',
        },
      });
    }

    const result = await draftService.unlockClause(clauseId, userId, user.name);

    if (!result.success) {
      const statusCode = result.error?.code === 'NOT_FOUND' ? 404 
        : result.error?.code === 'FORBIDDEN' ? 403 
        : 500;
      return res.status(statusCode).json({ error: result.error });
    }

    res.json({ clause: result.clause });
  } catch (error: any) {
    console.error('Error unlocking clause:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to unlock clause',
      },
    });
  }
}

/**
 * Get all variables for a clause
 * GET /api/v1/clauses/:clauseId/variables
 */
export async function getVariablesForClause(req: Request, res: Response) {
  try {
    const { clauseId } = req.params;
    const userId = req.user!.id;

    const variables = await draftService.getVariablesForClause(clauseId, userId);

    res.json({ variables });
  } catch (error: any) {
    console.error('Error getting variables for clause:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get variables',
      },
    });
  }
}

/**
 * Get all variables for a workspace
 * GET /api/v1/workspaces/:id/variables
 */
export async function getVariablesForWorkspace(req: Request, res: Response) {
  try {
    const workspaceId = req.params.id;
    const userId = req.user!.id;

    const variables = await draftService.getVariablesForWorkspace(workspaceId, userId);

    res.json({ variables });
  } catch (error: any) {
    console.error('Error getting variables for workspace:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get variables',
      },
    });
  }
}

/**
 * Bind a variable to a clause
 * POST /api/v1/workspaces/:id/variables
 */
export async function bindVariable(req: Request, res: Response) {
  try {
    const workspaceId = req.params.id;
    const userId = req.user!.id;
    const { clauseId, label, type, value, unit, baselineValue } = req.body;

    // Validate required fields
    if (!clauseId || !label || !type || value === undefined) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields: clauseId, label, type, value',
        },
      });
    }

    // Get actor name
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    if (!user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not found',
        },
      });
    }

    const result = await draftService.bindVariable(
      {
        workspaceId,
        clauseId,
        label,
        type: type as VariableType,
        value,
        unit,
        baselineValue,
      },
      userId,
      user.name
    );

    if (!result.success) {
      const statusCode = result.error?.code === 'NOT_FOUND' ? 404 
        : result.error?.code === 'FORBIDDEN' ? 403 
        : result.error?.code === 'VALIDATION_ERROR' ? 400 
        : 500;
      return res.status(statusCode).json({ error: result.error });
    }

    res.status(201).json({ variable: result.variable });
  } catch (error: any) {
    console.error('Error binding variable:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to bind variable',
      },
    });
  }
}

/**
 * Update an existing variable
 * PATCH /api/v1/variables/:variableId
 */
export async function updateVariable(req: Request, res: Response) {
  try {
    const { variableId } = req.params;
    const userId = req.user!.id;
    const { label, type, value, unit } = req.body;

    // Get actor name
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    if (!user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not found',
        },
      });
    }

    const result = await draftService.updateVariable(
      variableId,
      {
        label,
        type: type as VariableType,
        value,
        unit,
      },
      userId,
      user.name
    );

    if (!result.success) {
      const statusCode = result.error?.code === 'NOT_FOUND' ? 404 
        : result.error?.code === 'FORBIDDEN' ? 403 
        : result.error?.code === 'VALIDATION_ERROR' ? 400 
        : 500;
      return res.status(statusCode).json({ error: result.error });
    }

    res.json({ variable: result.variable });
  } catch (error: any) {
    console.error('Error updating variable:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update variable',
      },
    });
  }
}

/**
 * Delete a variable
 * DELETE /api/v1/variables/:variableId
 */
export async function deleteVariable(req: Request, res: Response) {
  try {
    const { variableId } = req.params;
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    if (!user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not found',
        },
      });
    }

    const result = await draftService.deleteVariable(variableId, userId, user.name);

    if (!result.success) {
      const statusCode = result.error?.code === 'NOT_FOUND' ? 404 
        : result.error?.code === 'FORBIDDEN' ? 403 
        : 500;
      return res.status(statusCode).json({ error: result.error });
    }

    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting variable:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete variable',
      },
    });
  }
}

/**
 * Sync document to graph
 * POST /api/v1/workspaces/:id/sync
 */
export async function syncToGraph(req: Request, res: Response) {
  try {
    const workspaceId = req.params.id;
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    if (!user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not found',
        },
      });
    }

    const result = await draftService.syncToGraph(workspaceId, userId, user.name);

    if (!result.success) {
      const statusCode = result.error?.code === 'NOT_FOUND' ? 404 
        : result.error?.code === 'FORBIDDEN' ? 403 
        : result.error?.code === 'VALIDATION_ERROR' ? 400 
        : 500;
      return res.status(statusCode).json({ error: result.error });
    }

    res.json({
      integrityScore: result.integrityScore,
      nodeCount: result.nodeCount,
      edgeCount: result.edgeCount,
      driftCount: result.driftCount,
    });
  } catch (error: any) {
    console.error('Error syncing to graph:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to sync to graph',
      },
    });
  }
}
