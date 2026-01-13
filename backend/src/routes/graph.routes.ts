import { Router, IRouter } from 'express';
import { authenticate, requireAuth } from '../middleware/auth.js';
import * as graphController from '../controllers/graph.controller.js';

const router: IRouter = Router();

// ============================================
// GRAPH ROUTES
// ============================================

// Get graph state for a workspace
// GET /api/v1/graph/:workspaceId
router.get('/:workspaceId', authenticate, requireAuth, graphController.getGraph);

// Recompute graph for a workspace
// POST /api/v1/graph/:workspaceId/recompute
router.post('/:workspaceId/recompute', authenticate, requireAuth, graphController.recomputeGraph);

// Get a single node by ID
// GET /api/v1/graph/nodes/:nodeId
router.get('/nodes/:nodeId', authenticate, requireAuth, graphController.getNode);

// Locate a node (get its clause ID)
// GET /api/v1/graph/nodes/:nodeId/locate
router.get('/nodes/:nodeId/locate', authenticate, requireAuth, graphController.locateNode);

// Get connected nodes
// GET /api/v1/graph/nodes/:nodeId/connected
router.get('/nodes/:nodeId/connected', authenticate, requireAuth, graphController.getConnectedNodes);

export default router;
