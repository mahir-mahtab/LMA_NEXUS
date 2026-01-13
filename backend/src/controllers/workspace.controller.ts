import { Request, Response } from 'express';
import * as workspaceService from '../services/workspace.service.js';
import { Role } from '@prisma/client';
import { parseClausesFromText } from '../ai/index.js';
import { extractTextFromPdf } from '../utils/pdfParser.js';

/**
 * List workspaces for authenticated user
 * GET /api/v1/workspaces
 */
export async function listWorkspaces(req: Request, res: Response) {
  try {
    const userId = req.user!.id;

    const workspaces = await workspaceService.listWorkspacesForUser(userId);

    res.json({ workspaces });
  } catch (error: any) {
    console.error('Error listing workspaces:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to list workspaces',
      },
    });
  }
}

/**
 * Get workspace by ID
 * GET /api/v1/workspaces/:id
 */
export async function getWorkspace(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const workspace = await workspaceService.getWorkspace(id, userId);

    if (!workspace) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Workspace not found or access denied',
        },
      });
    }

    res.json({ workspace });
  } catch (error: any) {
    console.error('Error getting workspace:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get workspace',
      },
    });
  }
}

/**
 * Create new workspace
 * POST /api/v1/workspaces
 * Supports multipart form data with optional PDF file upload
 */
export async function createWorkspace(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const { name, currency, amount, standard, basePdfName, clausesText } = req.body;
    
    // Get uploaded file if present (from multer middleware)
    const uploadedFile = req.file;

    if (!name || !currency || !amount || !standard) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields: name, currency, amount, and standard are required',
        },
      });
    }

    // Determine text content for AI parsing
    let textForParsing: string | undefined = undefined;
    let pdfFileName: string | undefined = basePdfName;

    // Priority 1: Extract text from uploaded PDF file
    if (uploadedFile && uploadedFile.mimetype === 'application/pdf') {
      try {
        textForParsing = await extractTextFromPdf(uploadedFile.buffer);
        pdfFileName = uploadedFile.originalname;
        console.log(`Extracted ${textForParsing.length} characters from PDF: ${pdfFileName}`);
      } catch (pdfError: any) {
        console.error('PDF extraction error:', pdfError);
        return res.status(400).json({
          error: {
            code: 'PDF_PARSE_ERROR',
            message: `Failed to extract text from PDF: ${pdfError.message}`,
          },
        });
      }
    }
    // Priority 2: Use provided clausesText
    else if (clausesText && typeof clausesText === 'string' && clausesText.trim()) {
      textForParsing = clausesText.trim();
    }

    // Parse clauses with AI if we have text
    let aiParsedData = undefined;
    if (textForParsing) {
      try {
        aiParsedData = await parseClausesFromText(textForParsing);
        console.log(`AI parsed ${aiParsedData.clauses.length} clauses`);
      } catch (aiError: any) {
        console.error('AI parsing error:', aiError);
        return res.status(400).json({
          error: {
            code: 'AI_PARSE_ERROR',
            message: 'Failed to parse clauses from document text',
          },
        });
      }
    }

    const result = await workspaceService.createWorkspace(
      {
        name,
        currency,
        amount: parseFloat(amount),
        standard,
        basePdfName: pdfFileName,
      },
      userId,
      aiParsedData
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.status(201).json({
      workspace: result.workspace,
      membership: result.membership,
    });
  } catch (error: any) {
    console.error('Error creating workspace:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create workspace',
      },
    });
  }
}

/**
 * Get workspace members
 * GET /api/v1/workspaces/:id/members
 */
export async function getMembers(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const members = await workspaceService.getWorkspaceMembers(id, userId);

    if (members === null) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Workspace not found or access denied',
        },
      });
    }

    res.json({ members });
  } catch (error: any) {
    console.error('Error getting members:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get members',
      },
    });
  }
}

/**
 * Invite member to workspace
 * POST /api/v1/workspaces/:id/members
 */
export async function inviteMember(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and role are required',
        },
      });
    }

    // Validate role
    if (!Object.values(Role).includes(role as Role)) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid role',
        },
      });
    }

    const result = await workspaceService.inviteMember(
      {
        workspaceId: id,
        email,
        role: role as Role,
      },
      userId
    );

    if (!result.success) {
      const status = result.error?.code === 'PERMISSION_DENIED' ? 403 : 400;
      return res.status(status).json({ error: result.error });
    }

    res.status(201).json({ member: result.member });
  } catch (error: any) {
    console.error('Error inviting member:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to invite member',
      },
    });
  }
}

/**
 * Change member role
 * PATCH /api/v1/workspaces/:id/members/:memberId
 */
export async function changeMemberRole(req: Request, res: Response) {
  try {
    const { id, memberId } = req.params;
    const userId = req.user!.id;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Role is required',
        },
      });
    }

    // Validate role
    if (!Object.values(Role).includes(role as Role)) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid role',
        },
      });
    }

    const result = await workspaceService.changeMemberRole(
      {
        workspaceId: id,
        memberId,
        newRole: role as Role,
      },
      userId
    );

    if (!result.success) {
      const status = result.error?.code === 'PERMISSION_DENIED' ? 403 : 400;
      return res.status(status).json({ error: result.error });
    }

    res.json({ member: result.member });
  } catch (error: any) {
    console.error('Error changing role:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to change role',
      },
    });
  }
}

/**
 * Remove member from workspace
 * DELETE /api/v1/workspaces/:id/members/:memberId
 */
export async function removeMember(req: Request, res: Response) {
  try {
    const { id, memberId } = req.params;
    const userId = req.user!.id;

    const result = await workspaceService.removeMember(id, memberId, userId);

    if (!result.success) {
      const status = result.error?.code === 'PERMISSION_DENIED' ? 403 : 400;
      return res.status(status).json({ error: result.error });
    }

    res.status(204).send();
  } catch (error: any) {
    console.error('Error removing member:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to remove member',
      },
    });
  }
}

/**
 * Update governance rules
 * PATCH /api/v1/workspaces/:id/governance
 */
export async function updateGovernance(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const rules = req.body;

    const result = await workspaceService.updateGovernanceRules(id, rules, userId);

    if (!result.success) {
      const status = result.error?.code === 'PERMISSION_DENIED' ? 403 : 400;
      return res.status(status).json({ error: result.error });
    }

    res.json({ workspace: result.workspace });
  } catch (error: any) {
    console.error('Error updating governance:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update governance',
      },
    });
  }
}
