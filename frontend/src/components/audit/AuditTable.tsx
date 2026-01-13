/**
 * Audit Table Component
 * Displays audit events in a table format with timeline view
 * Requirements: 11.1, 11.2
 */

import React from 'react';
import { clsx } from 'clsx';
import { AuditEvent } from '../../types/audit';
import Badge from '../ui/Badge';

export interface AuditTableProps {
  events: AuditEvent[];
  loading?: boolean;
  onViewInDraft?: (event: AuditEvent) => void;
  onViewInGraph?: (event: AuditEvent) => void;
  showFullDetails?: boolean;
  className?: string;
}

const AuditTable: React.FC<AuditTableProps> = ({
  events,
  loading = false,
  onViewInDraft,
  onViewInGraph,
  showFullDetails = true,
  className = '',
}) => {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const formatEventType = (eventType: string) => {
    return eventType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getEventTypeColor = (eventType: string) => {
    const dangerEvents = ['MEMBER_REMOVED', 'DRIFT_OVERRIDE', 'SECTION_LOCKED'];
    const warningEvents = ['DRIFT_REVERT', 'RECON_REJECT', 'GOVERNANCE_UPDATED'];
    const successEvents = ['PUBLISH', 'DRIFT_APPROVE', 'RECON_APPLY'];
    
    if (dangerEvents.includes(eventType)) {
      return 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300';
    }
    if (warningEvents.includes(eventType)) {
      return 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300';
    }
    if (successEvents.includes(eventType)) {
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300';
    }
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
  };

  const formatTarget = (event: AuditEvent) => {
    if (!event.targetType || !event.targetId) return '-';
    
    const targetType = event.targetType.charAt(0).toUpperCase() + event.targetType.slice(1);
    const shortId = event.targetId.length > 8 ? 
      `${event.targetId.substring(0, 8)}...` : 
      event.targetId;
    
    return `${targetType}: ${shortId}`;
  };

  const formatStateChange = (beforeState?: string, afterState?: string) => {
    if (!beforeState && !afterState) return '-';
    
    const formatState = (state: string) => {
      try {
        const parsed = JSON.parse(state);
        if (typeof parsed === 'object') {
          return JSON.stringify(parsed, null, 2);
        }
        return state;
      } catch {
        return state;
      }
    };

    if (beforeState && afterState) {
      return (
        <div className="space-y-1 text-xs">
          <div className="text-slate-500 dark:text-slate-400">
            <span className="font-bold">Before:</span> {formatState(beforeState)}
          </div>
          <div className="text-slate-700 dark:text-slate-300">
            <span className="font-bold">After:</span> {formatState(afterState)}
          </div>
        </div>
      );
    }

    if (afterState) {
      return (
        <div className="text-xs text-slate-700 dark:text-slate-300">
          <span className="font-bold">Value:</span> {formatState(afterState)}
        </div>
      );
    }

    return (
      <div className="text-xs text-slate-500 dark:text-slate-400">
        <span className="font-bold">Previous:</span> {formatState(beforeState!)}
      </div>
    );
  };

  const canViewInDraft = (event: AuditEvent) => {
    return ['CLAUSE_EDIT', 'VARIABLE_EDIT', 'VARIABLE_BIND'].includes(event.eventType) &&
           event.targetType === 'clause' && event.targetId;
  };

  const canViewInGraph = (event: AuditEvent) => {
    return ['GRAPH_SYNC', 'VARIABLE_EDIT', 'VARIABLE_BIND'].includes(event.eventType) &&
           (event.targetType === 'node' || event.targetType === 'variable') && event.targetId;
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm ${className}`}>
        <div className="p-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex space-x-4 py-4 border-b border-slate-100 dark:border-slate-800 last:border-b-0">
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
              <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
              <div className="h-4 w-40 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
              <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-12 ${className}`}>
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            No audit events found
          </h3>
          <p className="text-slate-500 dark:text-slate-400">
            No audit events match your current filters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Timestamp
              </th>
              <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Actor
              </th>
              <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Action
              </th>
              <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Target
              </th>
              {showFullDetails && (
                <>
                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Changes
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Reason
                  </th>
                </>
              )}
              <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
            {events.map((event) => {
              const { date, time } = formatTimestamp(event.timestamp);
              
              return (
                <tr key={event.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="font-bold text-slate-900 dark:text-white">{date}</div>
                    <div className="text-slate-500 dark:text-slate-400 text-xs">{time}</div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-[10px] font-bold text-primary-600 dark:text-primary-400">
                        {event.actorName.charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          {event.actorName}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 text-xs">
                          {event.actorId.substring(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={clsx(
                      'px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider',
                      getEventTypeColor(event.eventType)
                    )}>
                      {formatEventType(event.eventType)}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                    {formatTarget(event)}
                  </td>
                  
                  {showFullDetails && (
                    <>
                      <td className="px-6 py-4 text-sm text-slate-900 dark:text-white max-w-xs">
                        <div className="truncate">
                          {formatStateChange(event.beforeState, event.afterState)}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 text-sm text-slate-900 dark:text-white max-w-xs">
                        {event.reason ? (
                          <div className="space-y-1">
                            <div className="truncate text-sm">{event.reason}</div>
                            {event.reasonCategory && (
                              <span className="inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                {event.reasonCategory.replace('_', ' ')}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">-</span>
                        )}
                      </td>
                    </>
                  )}
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    {canViewInDraft(event) && onViewInDraft && (
                      <button
                        onClick={() => onViewInDraft(event)}
                        className="font-bold text-xs text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
                      >
                        View in Draft
                      </button>
                    )}
                    
                    {canViewInGraph(event) && onViewInGraph && (
                      <button
                        onClick={() => onViewInGraph(event)}
                        className="font-bold text-xs text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
                      >
                        View in Graph
                      </button>
                    )}
                    
                    {!canViewInDraft(event) && !canViewInGraph(event) && (
                      <span className="text-slate-400 dark:text-slate-500">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditTable;