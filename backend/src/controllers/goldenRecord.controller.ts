import { Request, Response } from 'express';
import * as goldenRecordService from '../services/goldenRecord.service.js';
import { ReasonCategory } from '@prisma/client';
import { prisma } from '../index.js';

/**
 * Get the golden record for a workspace
 * GET /api/v1/golden-records/:workspaceId
 */
export async function getGoldenRecord(req: Request, res: Response) {
  try {
    const { workspaceId } = req.params;
    const userId = req.user!.id;

    const result = await goldenRecordService.getGoldenRecord(workspaceId, userId);

    if (!result.success) {
      const statusCode =
        result.error?.code === 'NOT_FOUND' ? 404 :
        result.error?.code === 'FORBIDDEN' ? 403 :
        result.error?.code === 'VALIDATION_ERROR' ? 400 : 500;
      return res.status(statusCode).json({ error: result.error });
    }

    res.json({ goldenRecord: result.goldenRecord });
  } catch (error: any) {
    console.error('Error getting golden record:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get golden record',
      },
    });
  }
}

/**
 * Export the golden record schema as JSON
 * POST /api/v1/golden-records/:workspaceId/export
 */
export async function exportSchema(req: Request, res: Response) {
  try {
    const { workspaceId } = req.params;
    const userId = req.user!.id;

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

    const result = await goldenRecordService.exportSchema(
      workspaceId,
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

    res.json({
      success: true,
      schemaJson: result.schemaJson,
      filename: result.filename,
    });
  } catch (error: any) {
    console.error('Error exporting schema:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to export schema',
      },
    });
  }
}

/**
 * Publish the golden record to downstream systems
 * POST /api/v1/golden-records/:workspaceId/publish
 */
export async function publish(req: Request, res: Response) {
  try {
    const { workspaceId } = req.params;
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

    const result = await goldenRecordService.publish(
      workspaceId,
      reason,
      userId,
      user.name,
      reasonCategory as ReasonCategory
    );

    if (!result.success) {
      const statusCode =
        result.error?.code === 'NOT_FOUND' ? 404 :
        result.error?.code === 'FORBIDDEN' ? 403 :
        result.error?.code === 'VALIDATION_ERROR' ? 400 : 500;
      return res.status(statusCode).json({ error: result.error });
    }

    res.json({ success: true, goldenRecord: result.goldenRecord });
  } catch (error: any) {
    console.error('Error publishing golden record:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to publish golden record',
      },
    });
  }
}

/**
 * Get covenants for a workspace
 * GET /api/v1/golden-records/:workspaceId/covenants
 */
export async function getCovenants(req: Request, res: Response) {
  try {
    const { workspaceId } = req.params;
    const userId = req.user!.id;

    const covenants = await goldenRecordService.getCovenants(workspaceId, userId);

    res.json({ covenants });
  } catch (error: any) {
    console.error('Error getting covenants:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get covenants',
      },
    });
  }
}

/**
 * Get downstream connectors for a workspace
 * GET /api/v1/golden-records/:workspaceId/connectors
 */
export async function getConnectors(req: Request, res: Response) {
  try {
    const { workspaceId } = req.params;
    const userId = req.user!.id;

    const connectors = await goldenRecordService.getConnectors(workspaceId, userId);

    res.json({ connectors });
  } catch (error: any) {
    console.error('Error getting connectors:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get connectors',
      },
    });
  }
}

/**
 * Test connection to a downstream system
 * POST /api/v1/golden-records/connectors/:connectorId/test
 */
export async function testConnection(req: Request, res: Response) {
  try {
    const { connectorId } = req.params;
    const userId = req.user!.id;

    const result = await goldenRecordService.testConnection(connectorId, userId);

    res.json(result);
  } catch (error: any) {
    console.error('Error testing connection:', error);
    res.status(500).json({
      success: false,
      message: 'Connection test failed',
    });
  }
}

/**
 * Check if publishing is allowed
 * GET /api/v1/golden-records/:workspaceId/can-publish
 */
export async function canPublish(req: Request, res: Response) {
  try {
    const { workspaceId } = req.params;
    const userId = req.user!.id;

    const result = await goldenRecordService.canPublish(workspaceId, userId);

    res.json(result);
  } catch (error: any) {
    console.error('Error checking can publish:', error);
    res.status(500).json({
      allowed: false,
      reason: 'Failed to check publish status',
      integrityScore: 0,
      unresolvedHighDriftCount: 0,
    });
  }
}
