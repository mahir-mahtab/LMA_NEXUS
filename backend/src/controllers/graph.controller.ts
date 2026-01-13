import { Request, Response } from 'express';
import * as graphService from '../services/graph.service.js';
import { prisma } from '../index.js';

/**
 * Get graph state for a workspace
 * GET /api/v1/graph/:workspaceId
 */
export async function getGraph(req: Request, res: Response) {
  try {
    const { workspaceId } = req.params;
    const userId = req.user!.id;

    const result = await graphService.getGraph(workspaceId, userId);

    if (!result.success) {
      const statusCode = result.error?.code === 'FORBIDDEN' ? 403 : 500;
      return res.status(statusCode).json({
        error: result.error,
      });
    }

    res.json({ graph: result.graph });
  } catch (error: any) {
    console.error('Error getting graph:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get graph',
      },
    });
  }
}

/**
 * Recompute graph for a workspace
 * POST /api/v1/graph/:workspaceId/recompute
 */
export async function recomputeGraph(req: Request, res: Response) {
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

    const result = await graphService.recomputeGraph(workspaceId, userId, user.name);

    if (!result.success) {
      const statusCode = result.error?.code === 'FORBIDDEN' ? 403 : 500;
      return res.status(statusCode).json({
        error: result.error,
      });
    }

    res.json({
      success: true,
      integrityScore: result.integrityScore,
      nodeCount: result.nodeCount,
      edgeCount: result.edgeCount,
    });
  } catch (error: any) {
    console.error('Error recomputing graph:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to recompute graph',
      },
    });
  }
}

/**
 * Locate a node (get its clause ID)
 * GET /api/v1/graph/nodes/:nodeId/locate
 */
export async function locateNode(req: Request, res: Response) {
  try {
    const { nodeId } = req.params;
    const userId = req.user!.id;

    const result = await graphService.locateNode(nodeId, userId);

    if (!result.success) {
      const statusCode =
        result.error?.code === 'NOT_FOUND' ? 404 :
        result.error?.code === 'FORBIDDEN' ? 403 : 500;
      return res.status(statusCode).json({
        error: result.error,
      });
    }

    res.json({
      success: true,
      clauseId: result.clauseId,
      variableId: result.variableId,
    });
  } catch (error: any) {
    console.error('Error locating node:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to locate node',
      },
    });
  }
}

/**
 * Get a single node by ID
 * GET /api/v1/graph/nodes/:nodeId
 */
export async function getNode(req: Request, res: Response) {
  try {
    const { nodeId } = req.params;
    const userId = req.user!.id;

    const result = await graphService.getNode(nodeId, userId);

    if (!result.success) {
      const statusCode =
        result.error?.code === 'NOT_FOUND' ? 404 :
        result.error?.code === 'FORBIDDEN' ? 403 : 500;
      return res.status(statusCode).json({
        error: result.error,
      });
    }

    res.json({ node: result.node });
  } catch (error: any) {
    console.error('Error getting node:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get node',
      },
    });
  }
}

/**
 * Get all nodes connected to a given node
 * GET /api/v1/graph/nodes/:nodeId/connected
 */
export async function getConnectedNodes(req: Request, res: Response) {
  try {
    const { nodeId } = req.params;
    const userId = req.user!.id;

    const result = await graphService.getConnectedNodes(nodeId, userId);

    if (!result.success) {
      const statusCode =
        result.error?.code === 'NOT_FOUND' ? 404 :
        result.error?.code === 'FORBIDDEN' ? 403 : 500;
      return res.status(statusCode).json({
        error: result.error,
      });
    }

    res.json({ nodes: result.nodes });
  } catch (error: any) {
    console.error('Error getting connected nodes:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get connected nodes',
      },
    });
  }
}
