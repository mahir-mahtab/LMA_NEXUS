import { prisma } from '../index.js';
import { AuditEventType, ReasonCategory } from '@prisma/client';

// ============================================
// TYPES
// ============================================

export interface AuditEventResponse {
  id: string;
  workspaceId: string | null;
  timestamp: string;
  actorId: string;
  actorName: string;
  eventType: AuditEventType;
  targetType: string | null;
  targetId: string | null;
  beforeState: string | null;
  afterState: string | null;
  reason: string | null;
  reasonCategory: ReasonCategory | null;
}

export interface ServiceError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface LogEventInput {
  workspaceId: string | null;
  actorId: string;
  actorName: string;
  eventType: AuditEventType;
  targetType?: string;
  targetId?: string;
  beforeState?: string;
  afterState?: string;
  reason?: string;
  reasonCategory?: ReasonCategory;
}

export interface LogEventResult {
  success: boolean;
  event?: AuditEventResponse;
  error?: ServiceError;
}

export interface ListEventsFilter {
  workspaceId?: string;
  eventType?: AuditEventType;
  actorId?: string;
  startDate?: string;
  endDate?: string;
  keyword?: string;
  targetType?: string;
  targetId?: string;
}

export type ExportFormat = 'json' | 'csv';

export interface ExportAuditResult {
  success: boolean;
  data?: string;
  filename?: string;
  error?: ServiceError;
}

// ============================================
// SERVICE FUNCTIONS
// ============================================

/**
 * Log an audit event
 * Events are immutable once created - they cannot be modified or deleted
 */
export async function logEvent(input: LogEventInput): Promise<LogEventResult> {
  try {
    // Validate required fields
    if (!input.actorId) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Actor ID is required',
        },
      };
    }

    if (!input.actorName) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Actor name is required',
        },
      };
    }

    if (!input.eventType) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Event type is required',
        },
      };
    }

    // Create immutable audit event
    const event = await prisma.auditEvent.create({
      data: {
        workspaceId: input.workspaceId,
        actorId: input.actorId,
        actorName: input.actorName,
        eventType: input.eventType,
        targetType: input.targetType || null,
        targetId: input.targetId || null,
        beforeState: input.beforeState || null,
        afterState: input.afterState || null,
        reason: input.reason || null,
        reasonCategory: input.reasonCategory || null,
      },
    });

    return {
      success: true,
      event: mapToAuditEventResponse(event),
    };
  } catch (error: any) {
    console.error('Error logging audit event:', error);
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to log audit event',
        details: { error: error.message },
      },
    };
  }
}

/**
 * List audit events with optional filtering
 */
export async function listEvents(
  filter?: ListEventsFilter,
  userId?: string
): Promise<AuditEventResponse[]> {
  try {
    // Build where clause
    const where: any = {};

    if (filter?.workspaceId) {
      where.workspaceId = filter.workspaceId;
    }

    if (filter?.eventType) {
      where.eventType = filter.eventType;
    }

    if (filter?.actorId) {
      where.actorId = filter.actorId;
    }

    if (filter?.targetType) {
      where.targetType = filter.targetType;
    }

    if (filter?.targetId) {
      where.targetId = filter.targetId;
    }

    if (filter?.startDate || filter?.endDate) {
      where.timestamp = {};
      if (filter.startDate) {
        where.timestamp.gte = new Date(filter.startDate);
      }
      if (filter.endDate) {
        where.timestamp.lte = new Date(filter.endDate);
      }
    }

    // Keyword search across multiple fields
    if (filter?.keyword) {
      where.OR = [
        { actorName: { contains: filter.keyword, mode: 'insensitive' } },
        { eventType: { contains: filter.keyword, mode: 'insensitive' } },
        { targetType: { contains: filter.keyword, mode: 'insensitive' } },
        { reason: { contains: filter.keyword, mode: 'insensitive' } },
        { beforeState: { contains: filter.keyword, mode: 'insensitive' } },
        { afterState: { contains: filter.keyword, mode: 'insensitive' } },
      ];
    }

    const events = await prisma.auditEvent.findMany({
      where,
      orderBy: {
        timestamp: 'desc',
      },
    });

    return events.map(mapToAuditEventResponse);
  } catch (error: any) {
    console.error('Error listing audit events:', error);
    return [];
  }
}

/**
 * Get a single audit event by ID
 */
export async function getEvent(
  eventId: string,
  userId?: string
): Promise<AuditEventResponse | null> {
  try {
    if (!eventId) {
      return null;
    }

    const event = await prisma.auditEvent.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return null;
    }

    return mapToAuditEventResponse(event);
  } catch (error: any) {
    console.error('Error getting audit event:', error);
    return null;
  }
}

/**
 * Export audit events to JSON or CSV format
 */
export async function exportAudit(
  filter?: ListEventsFilter,
  format: ExportFormat = 'json',
  exporterUserId?: string,
  exporterName?: string
): Promise<ExportAuditResult> {
  try {
    // Get filtered events
    const events = await listEvents(filter, exporterUserId);

    if (events.length === 0) {
      return {
        success: true,
        data: format === 'json' ? '[]' : '',
        filename: `audit_export_${new Date().toISOString().split('T')[0]}.${format}`,
      };
    }

    let data: string;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    if (format === 'json') {
      data = JSON.stringify(events, null, 2);
    } else {
      // CSV format
      const headers = [
        'id',
        'timestamp',
        'workspaceId',
        'actorId',
        'actorName',
        'eventType',
        'targetType',
        'targetId',
        'beforeState',
        'afterState',
        'reason',
        'reasonCategory',
      ];

      const rows = events.map((e) =>
        [
          e.id,
          e.timestamp,
          e.workspaceId || '',
          e.actorId,
          e.actorName,
          e.eventType,
          e.targetType || '',
          e.targetId || '',
          escapeCSV(e.beforeState || ''),
          escapeCSV(e.afterState || ''),
          escapeCSV(e.reason || ''),
          e.reasonCategory || '',
        ].join(',')
      );

      data = [headers.join(','), ...rows].join('\n');
    }

    // Log the export action if exporter info provided
    if (exporterUserId && exporterName) {
      await logEvent({
        workspaceId: filter?.workspaceId || null,
        actorId: exporterUserId,
        actorName: exporterName,
        eventType: 'EXPORT_AUDIT',
        targetType: 'audit',
        afterState: JSON.stringify({
          format,
          eventCount: events.length,
          filter: filter || {},
        }),
      });
    }

    return {
      success: true,
      data,
      filename: `audit_export_${timestamp}.${format}`,
    };
  } catch (error: any) {
    console.error('Error exporting audit:', error);
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to export audit data',
        details: { error: error.message },
      },
    };
  }
}

/**
 * Get audit events for a specific target (e.g., a clause or variable)
 */
export async function getEventsForTarget(
  targetType: string,
  targetId: string,
  userId?: string
): Promise<AuditEventResponse[]> {
  return listEvents({ targetType, targetId }, userId);
}

/**
 * Get audit events by a specific actor
 */
export async function getEventsByActor(
  actorId: string,
  userId?: string
): Promise<AuditEventResponse[]> {
  return listEvents({ actorId }, userId);
}

/**
 * Get audit events for a workspace
 */
export async function getEventsForWorkspace(
  workspaceId: string,
  userId?: string
): Promise<AuditEventResponse[]> {
  return listEvents({ workspaceId }, userId);
}

/**
 * Count audit events matching a filter
 */
export async function countEvents(
  filter?: ListEventsFilter,
  userId?: string
): Promise<number> {
  try {
    const where: any = {};

    if (filter?.workspaceId) {
      where.workspaceId = filter.workspaceId;
    }

    if (filter?.eventType) {
      where.eventType = filter.eventType;
    }

    if (filter?.actorId) {
      where.actorId = filter.actorId;
    }

    if (filter?.targetType) {
      where.targetType = filter.targetType;
    }

    if (filter?.targetId) {
      where.targetId = filter.targetId;
    }

    if (filter?.startDate || filter?.endDate) {
      where.timestamp = {};
      if (filter.startDate) {
        where.timestamp.gte = new Date(filter.startDate);
      }
      if (filter.endDate) {
        where.timestamp.lte = new Date(filter.endDate);
      }
    }

    if (filter?.keyword) {
      where.OR = [
        { actorName: { contains: filter.keyword, mode: 'insensitive' } },
        { eventType: { contains: filter.keyword, mode: 'insensitive' } },
        { targetType: { contains: filter.keyword, mode: 'insensitive' } },
        { reason: { contains: filter.keyword, mode: 'insensitive' } },
        { beforeState: { contains: filter.keyword, mode: 'insensitive' } },
        { afterState: { contains: filter.keyword, mode: 'insensitive' } },
      ];
    }

    const count = await prisma.auditEvent.count({ where });
    return count;
  } catch (error: any) {
    console.error('Error counting audit events:', error);
    return 0;
  }
}

// ============================================
// MAPPERS
// ============================================

function mapToAuditEventResponse(event: any): AuditEventResponse {
  return {
    id: event.id,
    workspaceId: event.workspaceId,
    timestamp: event.timestamp.toISOString(),
    actorId: event.actorId,
    actorName: event.actorName,
    eventType: event.eventType,
    targetType: event.targetType,
    targetId: event.targetId,
    beforeState: event.beforeState,
    afterState: event.afterState,
    reason: event.reason,
    reasonCategory: event.reasonCategory,
  };
}

/**
 * Escape a string for CSV format
 */
function escapeCSV(value: string): string {
  if (!value) return '';
  // If value contains comma, newline, or quote, wrap in quotes and escape quotes
  if (value.includes(',') || value.includes('\n') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
