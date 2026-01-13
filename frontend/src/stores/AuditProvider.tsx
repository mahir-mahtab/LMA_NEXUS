/**
 * Audit Provider
 * Provides audit event stream for UI and refresh functionality
 * Requirements: 11.2
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AuditEvent, AuditEventType } from '../types/audit';
import * as auditService from '../services/auditService';
import { useWorkspace } from './WorkspaceProvider';
import { usePermission } from './PermissionProvider';

interface AuditFilter {
  eventType?: AuditEventType;
  actorId?: string;
  startDate?: string;
  endDate?: string;
  keyword?: string;
}

interface AuditContextValue {
  events: AuditEvent[];
  isLoading: boolean;
  error: string | null;
  filter: AuditFilter;
  setFilter: (filter: AuditFilter) => void;
  refreshAudit: () => Promise<void>;
  exportAudit: (format: 'json' | 'csv') => Promise<{ success: boolean; data?: string; filename?: string; error?: string }>;
}

const AuditContext = createContext<AuditContextValue | undefined>(undefined);

interface AuditProviderProps {
  children: ReactNode;
}

/**
 * Filter audit events based on user's permission level
 * Investors see limited audit entries (Requirements: 11.5, 11.6)
 */
function filterEventsForPermission(
  events: AuditEvent[],
  hasFullAccess: boolean
): AuditEvent[] {
  if (hasFullAccess) {
    return events;
  }

  // For limited access (Investor role), hide detailed reason text and negotiation info
  return events.map(event => ({
    ...event,
    reason: undefined,
    reasonCategory: undefined,
    beforeState: undefined,
    afterState: undefined,
  }));
}

export function AuditProvider({ children }: AuditProviderProps) {
  const { activeWorkspaceId } = useWorkspace();
  const { can } = usePermission();
  
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<AuditFilter>({});

  const hasFullAccess = can('audit:viewFull');

  const loadAuditEvents = useCallback(async () => {
    if (!activeWorkspaceId) return;

    setIsLoading(true);
    setError(null);

    try {
      const auditFilter: auditService.ListEventsFilter = {
        workspaceId: activeWorkspaceId,
        ...filter,
      };

      const loadedEvents = await auditService.listEvents(auditFilter);
      const filteredEvents = filterEventsForPermission(loadedEvents, hasFullAccess);
      setEvents(filteredEvents);
    } catch (err) {
      console.error('Failed to load audit events:', err);
      setError('Failed to load audit events');
    } finally {
      setIsLoading(false);
    }
  }, [activeWorkspaceId, filter, hasFullAccess]);

  // Load audit events when workspace changes or filter changes
  useEffect(() => {
    if (activeWorkspaceId) {
      loadAuditEvents();
    } else {
      setEvents([]);
    }
  }, [activeWorkspaceId, loadAuditEvents]);

  const refreshAudit = useCallback(async () => {
    await loadAuditEvents();
  }, [loadAuditEvents]);

  const exportAudit = useCallback(async (
    format: 'json' | 'csv'
  ): Promise<{ success: boolean; data?: string; filename?: string; error?: string }> => {
    if (!activeWorkspaceId) {
      return { success: false, error: 'No workspace selected' };
    }

    try {
      const auditFilter: auditService.ListEventsFilter = {
        workspaceId: activeWorkspaceId,
        ...filter,
      };

      const result = await auditService.exportAudit(auditFilter, format);
      
      if (result.success) {
        return {
          success: true,
          data: result.data,
          filename: result.filename,
        };
      }

      return {
        success: false,
        error: result.error?.message || 'Export failed',
      };
    } catch (err) {
      console.error('Failed to export audit:', err);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }, [activeWorkspaceId, filter]);

  const value: AuditContextValue = {
    events,
    isLoading,
    error,
    filter,
    setFilter,
    refreshAudit,
    exportAudit,
  };

  return (
    <AuditContext.Provider value={value}>
      {children}
    </AuditContext.Provider>
  );
}

/**
 * Hook to access audit context
 */
export function useAudit(): AuditContextValue {
  const context = useContext(AuditContext);
  if (context === undefined) {
    throw new Error('useAudit must be used within an AuditProvider');
  }
  return context;
}
