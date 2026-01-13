import { Router, IRouter } from 'express';
import { authenticate, requireAuth } from '../middleware/auth.js';
import * as auditController from '../controllers/audit.controller.js';

const router: IRouter = Router();

// ============================================
// AUDIT EVENT ROUTES
// ============================================

// Log an audit event
// POST /api/v1/audit/events
router.post('/events', authenticate, requireAuth, auditController.logEvent);

// List audit events with optional filtering
// GET /api/v1/audit/events
router.get('/events', authenticate, requireAuth, auditController.listEvents);

// Get a single audit event by ID
// GET /api/v1/audit/events/:eventId
router.get('/events/:eventId', authenticate, requireAuth, auditController.getEvent);

// Export audit events
// GET /api/v1/audit/export
router.get('/export', authenticate, requireAuth, auditController.exportAudit);

// Get audit events for a target (clause, variable, etc.)
// GET /api/v1/audit/target/:targetType/:targetId
router.get('/target/:targetType/:targetId', authenticate, requireAuth, auditController.getTargetAudit);

// Count audit events
// GET /api/v1/audit/count
router.get('/count', authenticate, requireAuth, auditController.countEvents);

export default router;
