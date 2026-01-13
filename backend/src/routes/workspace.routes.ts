import { Router, IRouter } from 'express';
import { authenticate, requireAuth } from '../middleware/auth.js';
import { uploadDocument } from '../middleware/upload.js';
import * as workspaceController from '../controllers/workspace.controller.js';
import * as draftController from '../controllers/draft.controller.js';

const router: IRouter = Router();

// List workspaces for authenticated user
router.get('/', authenticate, requireAuth, workspaceController.listWorkspaces);

// Create new workspace (supports multipart form data with optional PDF upload)
router.post('/', authenticate, requireAuth, uploadDocument, workspaceController.createWorkspace);

// Get workspace by ID
router.get('/:id', authenticate, requireAuth, workspaceController.getWorkspace);

// Get workspace members
router.get('/:id/members', authenticate, requireAuth, workspaceController.getMembers);

// Invite member to workspace
router.post('/:id/members', authenticate, requireAuth, workspaceController.inviteMember);

// Change member role
router.patch('/:id/members/:memberId', authenticate, requireAuth, workspaceController.changeMemberRole);

// Remove member from workspace
router.delete('/:id/members/:memberId', authenticate, requireAuth, workspaceController.removeMember);

// Update governance rules
router.patch('/:id/governance', authenticate, requireAuth, workspaceController.updateGovernance);

// ============================================
// DRAFT / DOCUMENT ROUTES (Workspace-scoped)
// ============================================

// Get document outline for workspace
router.get('/:id/outline', authenticate, requireAuth, draftController.getDocumentOutline);

// Get all clauses for workspace
router.get('/:id/clauses', authenticate, requireAuth, draftController.getClausesForWorkspace);

// Get all variables for workspace
router.get('/:id/variables', authenticate, requireAuth, draftController.getVariablesForWorkspace);

// Bind a new variable to a clause
router.post('/:id/variables', authenticate, requireAuth, draftController.bindVariable);

// Sync document to graph
router.post('/:id/sync', authenticate, requireAuth, draftController.syncToGraph);

export default router;
