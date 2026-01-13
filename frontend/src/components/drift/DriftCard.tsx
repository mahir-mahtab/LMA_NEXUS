/**
 * DriftCard Component
 * Displays drift item with title, severity badge, baseline vs current values, and expandable reason trail
 * Requirements: 7.1
 */

import React, { useState } from 'react';
import { clsx } from 'clsx';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { DriftItem } from '../../types/drift';
import { Badge, Button } from '../ui';
import { formatDistanceToNow } from 'date-fns';

interface DriftCardProps {
  drift: DriftItem;
  onOverrideBaseline?: (driftId: string) => void;
  onRevertDraft?: (driftId: string) => void;
  onApproveDrift?: (driftId: string) => void;
  onLocateInDraft?: (driftId: string) => void;
  canOverrideBaseline?: boolean;
  canRevertDraft?: boolean;
  canApproveDrift?: boolean;
  className?: string;
}

const DriftCard: React.FC<DriftCardProps> = ({
  drift,
  onOverrideBaseline,
  onRevertDraft,
  onApproveDrift,
  onLocateInDraft,
  canOverrideBaseline = false,
  canRevertDraft = false,
  canApproveDrift = false,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatValue = (value: string): string => {
    // Try to format as currency or percentage if it looks like one
    const numericValue = parseFloat(value.replace(/[^0-9.-]/g, ''));
    if (!isNaN(numericValue)) {
      if (value.includes('%')) {
        return `${numericValue}%`;
      }
      if (value.includes('$') || value.includes('€') || value.includes('£')) {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(numericValue);
      }
      if (value.includes('bps')) {
        return `${numericValue} bps`;
      }
    }
    return value;
  };

  const getStatusDisplay = (status: string): string => {
    switch (status) {
      case 'unresolved':
        return 'Unresolved';
      case 'overridden':
        return 'Baseline Overridden';
      case 'reverted':
        return 'Draft Reverted';
      case 'approved':
        return 'Approved';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unresolved':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300';
      case 'overridden':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300';
      case 'reverted':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
      case 'approved':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800';
      case 'MEDIUM':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800';
      case 'LOW':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  const hasActions = canOverrideBaseline || canRevertDraft || canApproveDrift || onLocateInDraft;
  const showActions = hasActions && drift.status === 'unresolved';

  return (
    <div className={clsx(
      'bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200',
      className
    )}>
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                {drift.title}
              </h3>
              <span className={clsx(
                'px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border',
                getSeverityColor(drift.severity)
              )}>
                {drift.severity}
              </span>
              <span className={clsx(
                'px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider',
                getStatusColor(drift.status)
              )}>
                {getStatusDisplay(drift.status)}
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              <span className="font-medium text-slate-600 dark:text-slate-300">
                {drift.type.charAt(0).toUpperCase() + drift.type.slice(1)}
              </span>
              {' '}• Modified {formatDistanceToNow(new Date(drift.currentModifiedAt), { addSuffix: true })}
            </p>
          </div>
        </div>

        {/* Value Comparison */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
              Baseline Value
            </div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white">
              {formatValue(drift.baselineValue)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Approved {formatDistanceToNow(new Date(drift.baselineApprovedAt), { addSuffix: true })}
            </div>
          </div>
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700 -ml-2"></div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
              Current Value
            </div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white">
              {formatValue(drift.currentValue)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Modified {formatDistanceToNow(new Date(drift.currentModifiedAt), { addSuffix: true })}
            </div>
          </div>
        </div>

        {/* Expandable Reason Trail */}
        {(drift.approvalReason || drift.status !== 'unresolved') && (
          <div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {isExpanded ? (
                <ChevronDownIcon className="w-4 h-4" />
              ) : (
                <ChevronRightIcon className="w-4 h-4" />
              )}
              Reason Trail
            </button>
            
            {isExpanded && (
              <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-l-4 border-primary-500">
                <div className="space-y-3">
                  {drift.approvalReason && (
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                        {drift.status === 'overridden' ? 'Override Reason' : 
                         drift.status === 'reverted' ? 'Revert Reason' :
                         drift.status === 'approved' ? 'Approval Reason' : 'Reason'}
                      </div>
                      <div className="text-sm text-slate-700 dark:text-slate-300">
                        {drift.approvalReason}
                      </div>
                      {drift.approvedBy && drift.approvedAt && (
                        <div className="text-xs text-slate-500 dark:text-slate-500 mt-2 flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-[10px] font-bold text-primary-600 dark:text-primary-400">
                            {drift.approvedBy.charAt(0).toUpperCase()}
                          </span>
                          <span>{drift.approvedBy}</span>
                          <span>•</span>
                          <span>{formatDistanceToNow(new Date(drift.approvedAt), { addSuffix: true })}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            {canOverrideBaseline && onOverrideBaseline && drift.status === 'unresolved' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onOverrideBaseline(drift.id)}
                className="h-9 px-4 rounded-xl font-bold text-xs"
              >
                Override Baseline
              </Button>
            )}
            {canRevertDraft && onRevertDraft && drift.status === 'unresolved' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onRevertDraft(drift.id)}
                className="h-9 px-4 rounded-xl font-bold text-xs"
              >
                Revert Draft
              </Button>
            )}
            {canApproveDrift && onApproveDrift && drift.status === 'unresolved' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onApproveDrift(drift.id)}
                className="h-9 px-4 rounded-xl font-bold text-xs shadow-lg shadow-primary-500/20"
              >
                Approve Drift
              </Button>
            )}
            {onLocateInDraft && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onLocateInDraft(drift.id)}
                className="h-9 px-4 rounded-xl font-bold text-xs ml-auto"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Locate in Draft
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DriftCard;