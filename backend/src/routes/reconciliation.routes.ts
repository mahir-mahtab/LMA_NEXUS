import { IRouter, Router } from 'express';
import * as reconciliationController from '../controllers/reconciliation.controller.js';
import { authenticate, requireAuth } from '../middleware/auth.js';
import { uploadDocument } from '../middleware/upload.js';

const router:IRouter = Router();

// ============================================
// RECONCILIATION ROUTES
// ============================================

/**
 * Upload a document for AI reconciliation
 * POST /api/v1/reconciliations/upload
 * Body: multipart/form-data with 'document' file and 'workspaceId' field
 * Returns: ReconciliationSession with items
 */
router.post(
  '/upload',
  authenticate,
  requireAuth,
  uploadDocument,
  reconciliationController.uploadDocument
);

/**
 * List reconciliation sessions for a workspace
 * GET /api/v1/reconciliations/sessions?workspaceId=xxx
 * Returns: Array of ReconciliationSession
 */
router.get(
  '/sessions',
  authenticate,
  requireAuth,
  reconciliationController.listSessions
);

/**
 * List reconciliation items for a session
 * GET /api/v1/reconciliations/sessions/:sessionId/items?decision=pending&confidence=HIGH
 * Returns: Array of ReconciliationItem
 */
router.get(
  '/sessions/:sessionId/items',
  authenticate,
  requireAuth,
  reconciliationController.listItems
);

/**
 * Get a single reconciliation item
 * GET /api/v1/reconciliations/items/:itemId
 * Returns: ReconciliationItem
 */
router.get(
  '/items/:itemId',
  authenticate,
  requireAuth,
  reconciliationController.getItem
);

/**
 * Apply a reconciliation suggestion
 * Updates variable value and creates drift if needed
 * POST /api/v1/reconciliations/items/:itemId/apply
 * Body: { reason?: string, reasonCategory?: ReasonCategory }
 * Returns: Updated ReconciliationItem with driftCreated flag
 */
router.post(
  '/items/:itemId/apply',
  authenticate,
  requireAuth,
  reconciliationController.applyItem
);

/**
 * Reject a reconciliation suggestion
 * POST /api/v1/reconciliations/items/:itemId/reject
 * Body: { reason?: string, reasonCategory?: ReasonCategory }
 * Returns: Updated ReconciliationItem
 */
router.post(
  '/items/:itemId/reject',
  authenticate,
  requireAuth,
  reconciliationController.rejectItem
);

export default router;
