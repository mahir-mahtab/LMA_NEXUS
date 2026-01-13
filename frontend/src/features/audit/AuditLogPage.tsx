/**
 * Audit Log Page
 * Complete audit event viewing with filtering, navigation, and export
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6
 */

import React, { useState, useEffect } from 'react';
import { useAudit } from '../../stores/AuditProvider';
import { usePermission } from '../../stores/PermissionProvider';
import { useWorkspace } from '../../stores/WorkspaceProvider';
import { getWorkspaceUsers } from '../../services/workspaceService';
import AuditFilterBar, { AuditFilter } from '../../components/audit/AuditFilterBar';
import AuditTable from '../../components/audit/AuditTable';
import AuditExport from '../../components/audit/AuditExport';
import { useAuditNavigation } from '../../components/audit/AuditNavigation';

const AuditLogPage: React.FC = () => {
  const { 
    events, 
    isLoading, 
    error, 
    filter, 
    setFilter, 
    refreshAudit 
  } = useAudit();
  
  const { can } = usePermission();
  const { activeWorkspace } = useWorkspace();
  const { navigateToClause, navigateToGraph } = useAuditNavigation();
  
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);

  // Check permissions for audit visibility
  const hasFullAccess = can('audit:viewFull');
  const hasLimitedAccess = can('audit:viewLimited');

  // Load users for filter dropdown from backend
  useEffect(() => {
    const loadUsers = async () => {
      if (!activeWorkspace?.id) return;
      
      try {
        const workspaceUsers = await getWorkspaceUsers(activeWorkspace.id);
        setUsers(workspaceUsers);
      } catch (error) {
        console.error('Failed to load users:', error);
      }
    };

    loadUsers();
  }, [activeWorkspace?.id]);

  // Handle filter changes
  const handleFilterChange = (newFilter: AuditFilter) => {
    setFilter(newFilter);
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setFilter({});
  };

  // Check access permissions
  if (!hasFullAccess && !hasLimitedAccess) {
    return (
      <div className="min-h-full bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Access Denied
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            You don't have permission to view audit logs.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading && events.length === 0) {
    return (
      <div className="min-h-full bg-slate-50 dark:bg-slate-950 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse"></div>
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
          <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Audit Log
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {activeWorkspace ? `${activeWorkspace.name} — ` : ''}
              Complete history of all actions and changes
            </p>
          </div>
          
          {/* Export Controls */}
          <AuditExport />
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-red-800 dark:text-red-200">
                  Error loading audit events
                </h3>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                  {error}
                </p>
                <button
                  onClick={refreshAudit}
                  className="mt-3 h-9 px-4 rounded-xl bg-red-100 dark:bg-red-900/30 text-sm font-bold text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800/50 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <AuditFilterBar
          filter={filter}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          users={users}
        />

        {/* Results Summary */}
        <div className="flex justify-between items-center text-sm">
          <div className="text-slate-600 dark:text-slate-400">
            {events.length > 0 ? (
              <span>
                Showing <span className="font-bold text-slate-900 dark:text-white">{events.length}</span> event{events.length !== 1 ? 's' : ''}
                {Object.values(filter).some(v => v) && <span className="text-slate-400"> (filtered)</span>}
              </span>
            ) : (
              'No events found'
            )}
          </div>
          
          {events.length > 0 && (
            <button
              onClick={refreshAudit}
              className="flex items-center gap-2 h-9 px-4 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-bold text-xs"
              disabled={isLoading}
            >
              <svg 
                className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
          )}
        </div>

        {/* Audit Table */}
        <AuditTable
          events={events}
          loading={isLoading}
          onViewInDraft={navigateToClause}
          onViewInGraph={navigateToGraph}
          showFullDetails={hasFullAccess}
        />
      </div>
    </div>
  );
};

export default AuditLogPage;