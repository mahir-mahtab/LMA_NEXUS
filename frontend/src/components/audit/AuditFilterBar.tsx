/**
 * Audit Filter Bar Component
 * Provides filtering controls for audit events
 * Requirements: 11.2
 */

import React from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { AuditEventType } from '../../types/audit';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';

export interface AuditFilter {
  eventType?: AuditEventType;
  actorId?: string;
  startDate?: string;
  endDate?: string;
  keyword?: string;
}

export interface AuditFilterBarProps {
  filter: AuditFilter;
  onFilterChange: (filter: AuditFilter) => void;
  onClearFilters: () => void;
  users?: Array<{ id: string; name: string }>;
  className?: string;
}

const EVENT_TYPE_OPTIONS = [
  { value: '', label: 'All Event Types' },
  { value: 'LOGIN', label: 'Login' },
  { value: 'LOGOUT', label: 'Logout' },
  { value: 'WORKSPACE_CREATE', label: 'Workspace Created' },
  { value: 'INVITE_SENT', label: 'Invite Sent' },
  { value: 'ROLE_CHANGED', label: 'Role Changed' },
  { value: 'MEMBER_REMOVED', label: 'Member Removed' },
  { value: 'CLAUSE_EDIT', label: 'Clause Edited' },
  { value: 'VARIABLE_EDIT', label: 'Variable Edited' },
  { value: 'VARIABLE_BIND', label: 'Variable Bound' },
  { value: 'GRAPH_SYNC', label: 'Graph Synced' },
  { value: 'DRIFT_OVERRIDE', label: 'Drift Override' },
  { value: 'DRIFT_REVERT', label: 'Drift Reverted' },
  { value: 'DRIFT_APPROVE', label: 'Drift Approved' },
  { value: 'RECON_APPLY', label: 'Reconciliation Applied' },
  { value: 'RECON_REJECT', label: 'Reconciliation Rejected' },
  { value: 'PUBLISH', label: 'Published' },
  { value: 'EXPORT_JSON', label: 'JSON Exported' },
  { value: 'EXPORT_AUDIT', label: 'Audit Exported' },
  { value: 'GOVERNANCE_UPDATED', label: 'Governance Updated' },
  { value: 'SECTION_LOCKED', label: 'Section Locked' },
  { value: 'SECTION_UNLOCKED', label: 'Section Unlocked' },
];

const AuditFilterBar: React.FC<AuditFilterBarProps> = ({
  filter,
  onFilterChange,
  onClearFilters,
  users = [],
  className = '',
}) => {
  const handleFilterChange = (key: keyof AuditFilter, value: string) => {
    onFilterChange({
      ...filter,
      [key]: value || undefined,
    });
  };

  const hasActiveFilters = Object.values(filter).some(value => value && value !== '');

  const userOptions = [
    { value: '', label: 'All Users' },
    ...users.map(user => ({
      value: user.id,
      label: user.name,
    })),
  ];

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm ${className}`}>
      <div className="flex flex-wrap gap-4">
        {/* Event Type Filter */}
        <div className="min-w-48">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
            Event Type
          </label>
          <Select
            value={filter.eventType || ''}
            onChange={(e) => handleFilterChange('eventType', e.target.value)}
            options={EVENT_TYPE_OPTIONS}
            className="rounded-xl border-slate-200 dark:border-slate-700"
          />
        </div>

        {/* User Filter */}
        <div className="min-w-48">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
            User
          </label>
          <Select
            value={filter.actorId || ''}
            onChange={(e) => handleFilterChange('actorId', e.target.value)}
            options={userOptions}
            className="rounded-xl border-slate-200 dark:border-slate-700"
          />
        </div>

        {/* Date Range Filters */}
        <div className="min-w-40">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
            Start Date
          </label>
          <Input
            type="date"
            value={filter.startDate || ''}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            className="rounded-xl border-slate-200 dark:border-slate-700"
          />
        </div>

        <div className="min-w-40">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
            End Date
          </label>
          <Input
            type="date"
            value={filter.endDate || ''}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            className="rounded-xl border-slate-200 dark:border-slate-700"
          />
        </div>

        {/* Keyword Search */}
        <div className="min-w-64 flex-1">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
            Search
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
            </div>
            <Input
              type="text"
              placeholder="Search events, reasons, or targets..."
              value={filter.keyword || ''}
              onChange={(e) => handleFilterChange('keyword', e.target.value)}
              className="pl-10 rounded-xl border-slate-200 dark:border-slate-700"
            />
          </div>
        </div>
      </div>

      {/* Active Filters Summary & Clear Button */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Active filters:
            </span>
            {filter.eventType && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                Type: {filter.eventType.replace('_', ' ')}
              </span>
            )}
            {filter.actorId && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                User: {users.find(u => u.id === filter.actorId)?.name || filter.actorId}
              </span>
            )}
            {filter.startDate && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300">
                From: {filter.startDate}
              </span>
            )}
            {filter.endDate && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300">
                To: {filter.endDate}
              </span>
            )}
            {filter.keyword && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                Search: "{filter.keyword}"
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-9 px-4 rounded-xl font-bold text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            <XMarkIcon className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>
      )}
    </div>
  );
};

export default AuditFilterBar;