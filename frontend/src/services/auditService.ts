/**
 * Audit Service
 * Handles audit event logging, retrieval, and export
 * Events are immutable once created
 * Requirements: 11.1, 11.2, 11.4
 */

import { AuditEvent, AuditEventType, ReasonCategory } from '../types/audit';

// API Base URL - configure for your environment
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';

/**
 * Service error type
 */
export interface ServiceError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Log event input
 */
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

/**
 * Log event result
 */
export interface LogEventResult {
  success: boolean;
  event?: AuditEvent;
  error?: ServiceError;
}

/**
 * List events filter
 */
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

/**
 * Export format
 */
export type ExportFormat = 'json' | 'csv';

/**
 * Export result
 */
export interface ExportAuditResult {
  success: boolean;
  data?: string;
  filename?: string;
  error?: ServiceError;
}

/**
 * Get access token from storage
 */
function getAccessToken(): string | null {
  return localStorage.getItem('lma_access_token');
}

/**
 * Make authenticated API request
 */
async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAccessToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  return response;
}

/**
 * Log an audit event
 * Events are immutable once created - they cannot be modified or deleted
 * Requirements: 11.1
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

    const response = await fetchWithAuth(`${API_BASE_URL}/audit/events`, {
      method: 'POST',
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || {
          code: 'API_ERROR',
          message: 'Failed to log audit event',
        },
      };
    }

    const data = await response.json();
    return {
      success: true,
      event: data.event,
    };
  } catch (error: any) {
    console.error('Error logging audit event:', error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Network error while logging audit event',
        details: { error: error.message },
      },
    };
  }
}

/**
 * List audit events with optional filtering
 * Requirements: 11.2
 */
export async function listEvents(filter?: ListEventsFilter): Promise<AuditEvent[]> {
  try {
    const queryParams = new URLSearchParams();
    
    if (filter) {
      if (filter.workspaceId) queryParams.append('workspaceId', filter.workspaceId);
      if (filter.eventType) queryParams.append('eventType', filter.eventType);
      if (filter.actorId) queryParams.append('actorId', filter.actorId);
      if (filter.startDate) queryParams.append('startDate', filter.startDate);
      if (filter.endDate) queryParams.append('endDate', filter.endDate);
      if (filter.keyword) queryParams.append('keyword', filter.keyword);
      if (filter.targetType) queryParams.append('targetType', filter.targetType);
      if (filter.targetId) queryParams.append('targetId', filter.targetId);
    }

    const url = `${API_BASE_URL}/audit/events${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await fetchWithAuth(url);

    if (!response.ok) {
      console.error('Failed to list audit events');
      return [];
    }

    const data = await response.json();
    return data.events || [];
  } catch (error: any) {
    console.error('Error listing audit events:', error);
    return [];
  }
}

/**
 * Get a single audit event by ID
 */
export async function getEvent(eventId: string): Promise<AuditEvent | null> {
  try {
    if (!eventId) {
      return null;
    }

    const response = await fetchWithAuth(`${API_BASE_URL}/audit/events/${eventId}`);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.event || null;
  } catch (error: any) {
    console.error('Error getting audit event:', error);
    return null;
  }
}

/**
 * Export audit events to JSON or CSV format
 * Requirements: 11.4
 */
export async function exportAudit(
  filter?: ListEventsFilter,
  format: ExportFormat = 'json',
  exporterUserId?: string,
  exporterName?: string
): Promise<ExportAuditResult> {
  try {
    const queryParams = new URLSearchParams();
    
    if (filter) {
      if (filter.workspaceId) queryParams.append('workspaceId', filter.workspaceId);
      if (filter.eventType) queryParams.append('eventType', filter.eventType);
      if (filter.actorId) queryParams.append('actorId', filter.actorId);
      if (filter.startDate) queryParams.append('startDate', filter.startDate);
      if (filter.endDate) queryParams.append('endDate', filter.endDate);
      if (filter.keyword) queryParams.append('keyword', filter.keyword);
      if (filter.targetType) queryParams.append('targetType', filter.targetType);
      if (filter.targetId) queryParams.append('targetId', filter.targetId);
    }
    
    queryParams.append('format', format);

    const url = `${API_BASE_URL}/audit/export?${queryParams.toString()}`;
    const response = await fetchWithAuth(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || {
          code: 'API_ERROR',
          message: 'Failed to export audit data',
        },
      };
    }

    const data = await response.text();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `audit_export_${timestamp}.${format}`;

    return {
      success: true,
      data,
      filename,
    };
  } catch (error: any) {
    console.error('Error exporting audit:', error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Network error while exporting audit data',
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
  targetId: string
): Promise<AuditEvent[]> {
  return listEvents({ targetType, targetId });
}

/**
 * Get audit events by a specific actor
 */
export async function getEventsByActor(actorId: string): Promise<AuditEvent[]> {
  return listEvents({ actorId });
}

/**
 * Get audit events for a workspace
 */
export async function getEventsForWorkspace(
  workspaceId: string
): Promise<AuditEvent[]> {
  return listEvents({ workspaceId });
}

/**
 * Count audit events matching a filter
 */
export async function countEvents(filter?: ListEventsFilter): Promise<number> {
  try {
    const queryParams = new URLSearchParams();
    
    if (filter) {
      if (filter.workspaceId) queryParams.append('workspaceId', filter.workspaceId);
      if (filter.eventType) queryParams.append('eventType', filter.eventType);
      if (filter.actorId) queryParams.append('actorId', filter.actorId);
      if (filter.startDate) queryParams.append('startDate', filter.startDate);
      if (filter.endDate) queryParams.append('endDate', filter.endDate);
      if (filter.keyword) queryParams.append('keyword', filter.keyword);
      if (filter.targetType) queryParams.append('targetType', filter.targetType);
      if (filter.targetId) queryParams.append('targetId', filter.targetId);
    }

    const url = `${API_BASE_URL}/audit/count${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await fetchWithAuth(url);

    if (!response.ok) {
      console.error('Failed to count audit events');
      return 0;
    }

    const data = await response.json();
    return data.count || 0;
  } catch (error: any) {
    console.error('Error counting audit events:', error);
    return 0;
  }
}
