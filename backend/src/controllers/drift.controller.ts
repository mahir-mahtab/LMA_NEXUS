import { Request, Response } from 'express';
import * as driftService from '../services/drift.service.js';
import { ClauseType, DriftSeverity, DriftStatus, ReasonCategory } from '@prisma/client';
import { prisma } from '../index.js';

/**
 * List drift items with optional filtering
 * GET /api/v1/drifts
 */
export async function listDrift(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const { workspaceId, severity, type, status, keyword } = req.query;

    if (!workspaceId) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Workspace ID is required',
        },
      });
    }

    const filter: driftService.ListDriftFilter = {
      workspaceId: workspaceId as string,
    };

    if (severity) filter.severity = severity as DriftSeverity;
    if (type) filter.type = type as ClauseType;
    if (status) filter.status = status as DriftStatus;
    if (keyword) filter.keyword = keyword as string;

    const driftItems = await driftService.listDrift(filter, userId);

    res.json({ driftItems });
  } catch (error: any) {
    console.error('Error listing drift items:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to list drift items',
      },
    });
  }
}

/**
 * Get a single drift item by ID
 * GET /api/v1/drifts/:driftId
 */
export async function getDrift(req: Request, res: Response) {
  try {
    const { driftId } = req.params;
    const userId = req.user!.id;

    const drift = await driftService.getDrift(driftId, userId);

    if (!drift) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Drift item not found',
        },
      });
    }

    res.json({ drift });
  } catch (error: any) {
    console.error('Error getting drift item:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get drift item',
      },
    });
  }
}

/**
 * Override baseline - sets baselineValue = currentValue
 * POST /api/v1/drifts/:driftId/override
 */
export async function overrideBaseline(req: Request, res: Response) {
  try {
    const { driftId } = req.params;
    const userId = req.user!.id;
    const { reason, reasonCategory } = req.body;

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

    const result = await driftService.overrideBaseline(
      {
        driftId,
        reason,
        reasonCategory: reasonCategory as ReasonCategory,
      },
      userId,
      user.name
    );

    if (!result.success) {
      const statusCode =
        result.error?.code === 'NOT_FOUND' ? 404 :
        result.error?.code === 'FORBIDDEN' ? 403 :
        result.error?.code === 'VALIDATION_ERROR' ? 400 : 500;
      return res.status(statusCode).json({ error: result.error });
    }

    res.json({ success: true, drift: result.drift });
  } catch (error: any) {
    console.error('Error overriding baseline:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to override baseline',
      },
    });
  }
}

/**
 * Revert draft - sets currentValue = baselineValue
 * POST /api/v1/drifts/:driftId/revert
 */
export async function revertDraft(req: Request, res: Response) {
  try {
    const { driftId } = req.params;
    const userId = req.user!.id;
    const { reason, reasonCategory } = req.body;

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

    const result = await driftService.revertDraft(
      {
        driftId,
        reason,
        reasonCategory: reasonCategory as ReasonCategory,
      },
      userId,
      user.name
    );

    if (!result.success) {
      const statusCode =
        result.error?.code === 'NOT_FOUND' ? 404 :
        result.error?.code === 'FORBIDDEN' ? 403 :
        result.error?.code === 'VALIDATION_ERROR' ? 400 : 500;
      return res.status(statusCode).json({ error: result.error });
    }

    res.json({ success: true, drift: result.drift });
  } catch (error: any) {
    console.error('Error reverting draft:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to revert draft',
      },
    });
  }
}

/**
 * Approve drift item
 * POST /api/v1/drifts/:driftId/approve
 */
export async function approveDrift(req: Request, res: Response) {
  try {
    const { driftId } = req.params;
    const userId = req.user!.id;
    const { reason } = req.body;

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

    const result = await driftService.approveDrift(
      driftId,
      reason,
      userId,
      user.name
    );

    if (!result.success) {
      const statusCode =
        result.error?.code === 'NOT_FOUND' ? 404 :
        result.error?.code === 'FORBIDDEN' ? 403 :
        result.error?.code === 'VALIDATION_ERROR' ? 400 : 500;
      return res.status(statusCode).json({ error: result.error });
    }

    res.json({ success: true, drift: result.drift });
  } catch (error: any) {
    console.error('Error approving drift:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to approve drift',
      },
    });
  }
}

/**
 * Recompute drift for a workspace
 * POST /api/v1/drifts/recompute
 */
export async function recomputeDrift(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const { workspaceId } = req.body;

    if (!workspaceId) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Workspace ID is required',
        },
      });
    }

    const result = await driftService.recomputeDrift(workspaceId, userId);

    if (!result.success) {
      const statusCode =
        result.error?.code === 'NOT_FOUND' ? 404 :
        result.error?.code === 'FORBIDDEN' ? 403 :
        result.error?.code === 'VALIDATION_ERROR' ? 400 : 500;
      return res.status(statusCode).json({ error: result.error });
    }

    res.json({ success: true, driftCount: result.driftCount });
  } catch (error: any) {
    console.error('Error recomputing drift:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to recompute drift',
      },
    });
  }
}

/**
 * Get unresolved HIGH severity drift count
 * GET /api/v1/drifts/high-drift-count
 */
export async function getUnresolvedHighDriftCount(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const { workspaceId } = req.query;

    if (!workspaceId) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Workspace ID is required',
        },
      });
    }

    const count = await driftService.getUnresolvedHighDriftCount(
      workspaceId as string,
      userId
    );

    res.json({ count });
  } catch (error: any) {
    console.error('Error getting high drift count:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get high drift count',
      },
    });
  }
}

/**
 * Check if publishing is blocked due to HIGH drift
 * GET /api/v1/drifts/publish-blocked
 */
export async function isPublishBlocked(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const { workspaceId } = req.query;

    if (!workspaceId) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Workspace ID is required',
        },
      });
    }

    const blocked = await driftService.isPublishBlocked(
      workspaceId as string,
      userId
    );

    res.json({ blocked });
  } catch (error: any) {
    console.error('Error checking publish blocked:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to check publish blocked',
      },
    });
  }
}
