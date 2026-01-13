import { Router, IRouter } from 'express';
import { authenticate, requireAuth } from '../middleware/auth.js';
import * as goldenRecordController from '../controllers/goldenRecord.controller.js';

const router: IRouter = Router();

// ============================================
// GOLDEN RECORD ROUTES
// ============================================

// Test connection to a downstream system
// POST /api/v1/golden-records/connectors/:connectorId/test
router.post('/connectors/:connectorId/test', authenticate, requireAuth, goldenRecordController.testConnection);

// Get the golden record for a workspace
// GET /api/v1/golden-records/:workspaceId
router.get('/:workspaceId', authenticate, requireAuth, goldenRecordController.getGoldenRecord);

// Export the golden record schema as JSON
// POST /api/v1/golden-records/:workspaceId/export
router.post('/:workspaceId/export', authenticate, requireAuth, goldenRecordController.exportSchema);

// Publish the golden record to downstream systems
// POST /api/v1/golden-records/:workspaceId/publish
router.post('/:workspaceId/publish', authenticate, requireAuth, goldenRecordController.publish);

// Get covenants for a workspace
// GET /api/v1/golden-records/:workspaceId/covenants
router.get('/:workspaceId/covenants', authenticate, requireAuth, goldenRecordController.getCovenants);

// Get downstream connectors for a workspace
// GET /api/v1/golden-records/:workspaceId/connectors
router.get('/:workspaceId/connectors', authenticate, requireAuth, goldenRecordController.getConnectors);

// Check if publishing is allowed
// GET /api/v1/golden-records/:workspaceId/can-publish
router.get('/:workspaceId/can-publish', authenticate, requireAuth, goldenRecordController.canPublish);

export default router;
