import { Router, IRouter } from 'express';
import { authenticate, requireAuth } from '../middleware/auth.js';
import * as driftController from '../controllers/drift.controller.js';

const router: IRouter = Router();

// ============================================
// DRIFT ROUTES
// ============================================

// List drift items with optional filtering
// GET /api/v1/drifts?workspaceId=xxx&severity=HIGH&type=financial&status=unresolved&keyword=xxx
router.get('/', authenticate, requireAuth, driftController.listDrift);

// Get unresolved HIGH severity drift count
// GET /api/v1/drifts/high-drift-count?workspaceId=xxx
router.get('/high-drift-count', authenticate, requireAuth, driftController.getUnresolvedHighDriftCount);

// Check if publishing is blocked due to HIGH drift
// GET /api/v1/drifts/publish-blocked?workspaceId=xxx
router.get('/publish-blocked', authenticate, requireAuth, driftController.isPublishBlocked);

// Recompute drift for a workspace
// POST /api/v1/drifts/recompute
router.post('/recompute', authenticate, requireAuth, driftController.recomputeDrift);

// Get a single drift item by ID
// GET /api/v1/drifts/:driftId
router.get('/:driftId', authenticate, requireAuth, driftController.getDrift);

// Override baseline - sets baselineValue = currentValue
// POST /api/v1/drifts/:driftId/override
router.post('/:driftId/override', authenticate, requireAuth, driftController.overrideBaseline);

// Revert draft - sets currentValue = baselineValue
// POST /api/v1/drifts/:driftId/revert
router.post('/:driftId/revert', authenticate, requireAuth, driftController.revertDraft);

// Approve drift item
// POST /api/v1/drifts/:driftId/approve
router.post('/:driftId/approve', authenticate, requireAuth, driftController.approveDrift);

export default router;
