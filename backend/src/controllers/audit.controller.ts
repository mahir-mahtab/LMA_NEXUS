import { Request, Response } from 'express';
import * as auditService from '../services/audit.service.js';
import { AuditEventType, ReasonCategory } from '@prisma/client';
import { prisma } from '../index.js';

/**
 * Log an audit event
 * POST /api/v1/audit/events
 */
export async function logEvent(req: Request, res: Response) {
  try {
    const userId = req.user!.id;

    // Get user name from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    if (!user) {
      return res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    const {
      workspaceId,
      eventType,
      targetType,
      targetId,
      beforeState,
      afterState,
      reason,
      reasonCategory,
    } = req.body;

    const result = await auditService.logEvent({
      workspaceId: workspaceId || null,
      actorId: userId,
      actorName: user.name,
      eventType,
      targetType,
      targetId,
      beforeState,
      afterState,
      reason,
      reasonCategory,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.status(201).json({ event: result.event });
  } catch (error: any) {
    console.error('Error logging audit event:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to log audit event',
      },
    });
  }
}

/**
 * List audit events with optional filtering
 * GET /api/v1/audit/events
 */
export async function listEvents(req: Request, res: Response) {
  try {
    const userId = req.user!.id;

    const {
      workspaceId,
      eventType,
      actorId,
      startDate,
      endDate,
      keyword,
      targetType,
      targetId,
    } = req.query;

    const filter: auditService.ListEventsFilter = {};

    if (workspaceId) filter.workspaceId = workspaceId as string;
    if (eventType) filter.eventType = eventType as AuditEventType;
    if (actorId) filter.actorId = actorId as string;
    if (startDate) filter.startDate = startDate as string;
    if (endDate) filter.endDate = endDate as string;
    if (keyword) filter.keyword = keyword as string;
    if (targetType) filter.targetType = targetType as string;
    if (targetId) filter.targetId = targetId as string;

    const events = await auditService.listEvents(filter, userId);

    res.json({ events });
  } catch (error: any) {
    console.error('Error listing audit events:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to list audit events',
      },
    });
  }
}

/**
 * Get a single audit event by ID
 * GET /api/v1/audit/events/:eventId
 */
export async function getEvent(req: Request, res: Response) {
  try {
    const { eventId } = req.params;
    const userId = req.user!.id;

    const event = await auditService.getEvent(eventId, userId);

    if (!event) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Audit event not found',
        },
      });
    }

    res.json({ event });
  } catch (error: any) {
    console.error('Error getting audit event:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get audit event',
      },
    });
  }
}

/**
 * Export audit events
 * GET /api/v1/audit/export
 */
export async function exportAudit(req: Request, res: Response) {
  try {
    const userId = req.user!.id;

    // Get user name from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    if (!user) {
      return res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    const {
      workspaceId,
      eventType,
      actorId,
      startDate,
      endDate,
      keyword,
      targetType,
      targetId,
      format = 'json',
    } = req.query;

    const filter: auditService.ListEventsFilter = {};

    if (workspaceId) filter.workspaceId = workspaceId as string;
    if (eventType) filter.eventType = eventType as AuditEventType;
    if (actorId) filter.actorId = actorId as string;
    if (startDate) filter.startDate = startDate as string;
    if (endDate) filter.endDate = endDate as string;
    if (keyword) filter.keyword = keyword as string;
    if (targetType) filter.targetType = targetType as string;
    if (targetId) filter.targetId = targetId as string;

    const result = await auditService.exportAudit(
      filter,
      format as auditService.ExportFormat,
      userId,
      user.name
    );

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    // Set appropriate headers for file download
    const contentType =
      format === 'json' ? 'application/json' : 'text/csv';
    res.setHeader('Content-Type', contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.filename}"`
    );

    res.send(result.data);
  } catch (error: any) {
    console.error('Error exporting audit:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to export audit data',
      },
    });
  }
}

/**
 * Get audit events for a workspace
 * GET /api/v1/workspaces/:workspaceId/audit
 */
export async function getWorkspaceAudit(req: Request, res: Response) {
  try {
    const { workspaceId } = req.params;
    const userId = req.user!.id;

    const events = await auditService.getEventsForWorkspace(workspaceId, userId);

    res.json({ events });
  } catch (error: any) {
    console.error('Error getting workspace audit:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get workspace audit events',
      },
    });
  }
}

/**
 * Get audit events for a target (clause, variable, etc.)
 * GET /api/v1/audit/target/:targetType/:targetId
 */
export async function getTargetAudit(req: Request, res: Response) {
  try {
    const { targetType, targetId } = req.params;
    const userId = req.user!.id;

    const events = await auditService.getEventsForTarget(
      targetType,
      targetId,
      userId
    );

    res.json({ events });
  } catch (error: any) {
    console.error('Error getting target audit:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get target audit events',
      },
    });
  }
}

/**
 * Count audit events
 * GET /api/v1/audit/count
 */
export async function countEvents(req: Request, res: Response) {
  try {
    const userId = req.user!.id;

    const {
      workspaceId,
      eventType,
      actorId,
      startDate,
      endDate,
      keyword,
      targetType,
      targetId,
    } = req.query;

    const filter: auditService.ListEventsFilter = {};

    if (workspaceId) filter.workspaceId = workspaceId as string;
    if (eventType) filter.eventType = eventType as AuditEventType;
    if (actorId) filter.actorId = actorId as string;
    if (startDate) filter.startDate = startDate as string;
    if (endDate) filter.endDate = endDate as string;
    if (keyword) filter.keyword = keyword as string;
    if (targetType) filter.targetType = targetType as string;
    if (targetId) filter.targetId = targetId as string;

    const count = await auditService.countEvents(filter, userId);

    res.json({ count });
  } catch (error: any) {
    console.error('Error counting audit events:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to count audit events',
      },
    });
  }
}
