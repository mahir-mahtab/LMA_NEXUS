/**
 * DriftFilterBar Component
 * Provides filtering controls for drift items by severity, type, and keyword search
 * Requirements: 7.5
 */

import React from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { DriftSeverity, DriftStatus } from '../../types/drift';
import { ClauseType } from '../../types/document';
import { Input, Select, Button } from '../ui';

export interface DriftFilters {
  severity?: DriftSeverity;
  type?: ClauseType;
  status?: DriftStatus;
  keyword?: string;
}

interface DriftFilterBarProps {
  filters: DriftFilters;
  onFiltersChange: (filters: DriftFilters) => void;
  className?: string;
}

const DriftFilterBar: React.FC<DriftFilterBarProps> = ({
  filters,
  onFiltersChange,
  className
}) => {
  const handleFilterChange = (key: keyof DriftFilters, value: string) => {
    const newFilters = { ...filters };
    if (value === '' || value === 'all') {
      delete newFilters[key];
    } else {
      newFilters[key] = value as any;
    }
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  const severityOptions = [
    { value: 'all', label: 'All Severities' },
    { value: 'HIGH', label: 'High' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'LOW', label: 'Low' },
  ];

  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'financial', label: 'Financial' },
    { value: 'covenant', label: 'Covenant' },
    { value: 'definition', label: 'Definition' },
    { value: 'xref', label: 'Cross-Reference' },
    { value: 'general', label: 'General' },
  ];

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'unresolved', label: 'Unresolved' },
    { value: 'overridden', label: 'Overridden' },
    { value: 'reverted', label: 'Reverted' },
    { value: 'approved', label: 'Approved' },
  ];

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm ${className || ''}`}>
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1 min-w-0">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
            </div>
            <Input
              type="text"
              placeholder="Search drift items..."
              value={filters.keyword || ''}
              onChange={(e) => handleFilterChange('keyword', e.target.value)}
              className="pl-10 rounded-xl border-slate-200 dark:border-slate-700 focus:ring-primary-500/20"
            />
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="min-w-0 sm:w-36">
            <Select
              value={filters.severity || 'all'}
              onChange={(e) => handleFilterChange('severity', e.target.value)}
              options={severityOptions}
              placeholder="Severity"
              className="rounded-xl border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="min-w-0 sm:w-36">
            <Select
              value={filters.type || 'all'}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              options={typeOptions}
              placeholder="Type"
              className="rounded-xl border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="min-w-0 sm:w-36">
            <Select
              value={filters.status || 'all'}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              options={statusOptions}
              placeholder="Status"
              className="rounded-xl border-slate-200 dark:border-slate-700"
            />
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-10 px-3 rounded-xl font-bold text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                <XMarkIcon className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Active filters:
            </span>
            {filters.severity && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                Severity: {filters.severity}
              </span>
            )}
            {filters.type && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                Type: {filters.type.charAt(0).toUpperCase() + filters.type.slice(1)}
              </span>
            )}
            {filters.status && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300">
                Status: {filters.status.charAt(0).toUpperCase() + filters.status.slice(1)}
              </span>
            )}
            {filters.keyword && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                Search: "{filters.keyword}"
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DriftFilterBar;