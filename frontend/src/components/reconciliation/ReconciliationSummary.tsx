/**
 * ReconciliationSummary Component
 * Displays session summary with counts, impact warnings, and navigation links
 * Requirements: 8.5
 */

import React from 'react';
import { Button } from '../ui';
import { ReconciliationSession } from '../../types/reconciliation';

export interface ReconciliationSummaryProps {
  session: ReconciliationSession;
  hasHighImpactChanges?: boolean;
  onNavigateToDrafting?: () => void;
  onNavigateToGraph?: () => void;
  onNavigateToDrift?: () => void;
  className?: string;
}

const ReconciliationSummary: React.FC<ReconciliationSummaryProps> = ({
  session,
  hasHighImpactChanges = false,
  onNavigateToDrafting,
  onNavigateToGraph,
  onNavigateToDrift,
  className
}) => {
  const completionPercentage = session.totalItems > 0 
    ? Math.round(((session.appliedCount + session.rejectedCount) / session.totalItems) * 100)
    : 0;

  const hasAppliedChanges = session.appliedCount > 0;

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm ${className || ''}`}>
      <div className="p-5 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
              Summary
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 truncate max-w-[200px]">
              {session.fileName}
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300">
            {completionPercentage}% Complete
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Progress</span>
            <span className="text-slate-900 dark:text-white font-bold">
              {session.appliedCount + session.rejectedCount} / {session.totalItems}
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Counts Grid */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <div className="text-xl font-extrabold text-slate-900 dark:text-white">
              {session.totalItems}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">
              Total
            </div>
          </div>
          <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
            <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {session.appliedCount}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mt-0.5">
              Applied
            </div>
          </div>
          <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
            <div className="text-xl font-extrabold text-red-600 dark:text-red-400">
              {session.rejectedCount}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-red-600 dark:text-red-400 mt-0.5">
              Rejected
            </div>
          </div>
          <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
            <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
              {session.pendingCount}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 mt-0.5">
              Pending
            </div>
          </div>
        </div>

        {/* Impact Warnings */}
        {hasAppliedChanges && (
          <div className="space-y-3">
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                Impact Assessment
              </h4>
              
              {hasHighImpactChanges && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 mb-3">
                  <div className="flex">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-xs font-bold text-amber-800 dark:text-amber-200">
                        High Impact Changes
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                        May affect financial calculations
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
                <div className="flex">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-xs font-bold text-blue-800 dark:text-blue-200">
                      Graph Updated
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                      Dependencies recalculated
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        {hasAppliedChanges && (
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
              Review Changes
            </h4>
            <div className="space-y-2">
              {onNavigateToDrafting && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onNavigateToDrafting}
                  className="w-full justify-start h-9 px-3 rounded-xl font-bold text-xs"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  View in Drafting
                </Button>
              )}
              
              {onNavigateToGraph && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onNavigateToGraph}
                  className="w-full justify-start h-9 px-3 rounded-xl font-bold text-xs"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Impact Map
                </Button>
              )}
              
              {onNavigateToDrift && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onNavigateToDrift}
                  className="w-full justify-start h-9 px-3 rounded-xl font-bold text-xs"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Commercial Drift
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Session Info */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-400">
                {session.uploadedBy.charAt(0).toUpperCase()}
              </span>
              <span>{session.uploadedBy}</span>
            </div>
            <span>{new Date(session.uploadedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReconciliationSummary;