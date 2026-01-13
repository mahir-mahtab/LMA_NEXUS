import { Router, IRouter } from 'express';
import { authenticate, requireAuth } from '../middleware/auth.js';
import * as draftController from '../controllers/draft.controller.js';

const router: IRouter = Router();

// ============================================
// CLAUSE ROUTES
// ============================================

// Get a single clause by ID
// GET /api/v1/drafts/clauses/:clauseId
router.get('/clauses/:clauseId', authenticate, requireAuth, draftController.getClause);

// Update clause text
// PATCH /api/v1/drafts/clauses/:clauseId
router.patch('/clauses/:clauseId', authenticate, requireAuth, draftController.updateClauseText);

// Lock a clause
// POST /api/v1/drafts/clauses/:clauseId/lock
router.post('/clauses/:clauseId/lock', authenticate, requireAuth, draftController.lockClause);

// Unlock a clause
// DELETE /api/v1/drafts/clauses/:clauseId/lock
router.delete('/clauses/:clauseId/lock', authenticate, requireAuth, draftController.unlockClause);

// Get all variables for a clause
// GET /api/v1/drafts/clauses/:clauseId/variables
router.get('/clauses/:clauseId/variables', authenticate, requireAuth, draftController.getVariablesForClause);

// ============================================
// VARIABLE ROUTES
// ============================================

// Update a variable
// PATCH /api/v1/drafts/variables/:variableId
router.patch('/variables/:variableId', authenticate, requireAuth, draftController.updateVariable);

// Delete a variable
// DELETE /api/v1/drafts/variables/:variableId
router.delete('/variables/:variableId', authenticate, requireAuth, draftController.deleteVariable);

export default router;
