/**
 * ReconciliationCard Component
 * Displays reconciliation suggestion with incoming snippet, target mapping, confidence badge, value comparison, and action buttons
 * Requirements: 8.2
 */

import React from 'react';
import { clsx } from 'clsx';
import { Button } from '../ui';
import { ReconciliationItem } from '../../types/reconciliation';

export interface ReconciliationCardProps {
  item: ReconciliationItem;
  clauseTitle?: string;
  variableLabel?: string;
  onApply: (itemId: string) => void;
  onReject: (itemId: string) => void;
  isApplying?: boolean;
  isRejecting?: boolean;
  canApplyReject?: boolean;
}

const ReconciliationCard: React.FC<ReconciliationCardProps> = ({
  item,
  clauseTitle,
  variableLabel,
  onApply,
  onReject,
  isApplying = false,
  isRejecting = false,
  canApplyReject = true
}) => {
  const formatDecisionText = (decision: string) => {
    switch (decision) {
      case 'applied':
        return 'Applied';
      case 'rejected':
        return 'Rejected';
      case 'pending':
      default:
        return 'Pending';
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'HIGH':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800';
      case 'MEDIUM':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800';
      case 'LOW':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'applied':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300';
      case 'rejected':
        return 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300';
      case 'pending':
      default:
        return 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300';
    }
  };

  const isDecided = item.decision !== 'pending';
  const isProcessing = isApplying || isRejecting;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="p-5 space-y-4">
        {/* Header with confidence and status */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <span className={clsx(
              'px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border',
              getConfidenceColor(item.confidence)
            )}>
              {item.confidence} Confidence
            </span>
            <span className={clsx(
              'px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider',
              getDecisionColor(item.decision)
            )}>
              {formatDecisionText(item.decision)}
            </span>
          </div>
          {isDecided && item.decidedAt && (
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {new Date(item.decidedAt).toLocaleDateString()}
            </div>
          )}
        </div>

        {/* Incoming snippet */}
        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
            Incoming Change
          </h4>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <p className="text-sm text-blue-900 dark:text-blue-100 font-mono leading-relaxed">
              {item.incomingSnippet}
            </p>
          </div>
        </div>

        {/* Target mapping */}
        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
            Target Location
          </h4>
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400 w-20 font-medium">Clause</span>
                <span className="text-slate-900 dark:text-white font-bold">
                  {clauseTitle || `Clause ${item.targetClauseId.slice(-8)}`}
                </span>
              </div>
              {item.targetVariableId && (
                <div className="flex items-center text-sm">
                  <span className="text-slate-500 dark:text-slate-400 w-20 font-medium">Variable</span>
                  <span className="text-slate-900 dark:text-white font-bold">
                    {variableLabel || `Variable ${item.targetVariableId.slice(-8)}`}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Value comparison */}
        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
            Value Comparison
          </h4>
          <div className="grid grid-cols-3 gap-3">
            {/* Baseline */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                Baseline
              </div>
              <div className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                {item.baselineValue}
              </div>
            </div>
            
            {/* Current */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
              <div className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-1">
                Current
              </div>
              <div className="text-sm font-mono font-bold text-amber-900 dark:text-amber-100">
                {item.currentValue}
              </div>
            </div>
            
            {/* Proposed */}
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3">
              <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1">
                Proposed
              </div>
              <div className="text-sm font-mono font-bold text-emerald-900 dark:text-emerald-100">
                {item.proposedValue}
              </div>
            </div>
          </div>
        </div>

        {/* Decision reason (if decided) */}
        {isDecided && item.decisionReason && (
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
              Decision Reason
            </h4>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border-l-4 border-primary-500">
              <p className="text-sm text-slate-700 dark:text-slate-300">
                {item.decisionReason}
              </p>
              {item.decidedBy && (
                <div className="flex items-center gap-2 mt-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-[10px] font-bold text-primary-600 dark:text-primary-400">
                    {item.decidedBy.charAt(0).toUpperCase()}
                  </span>
                  <span>{item.decidedBy}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action buttons */}
        {!isDecided && canApplyReject && (
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onReject(item.id)}
              disabled={isProcessing}
              loading={isRejecting}
              className="h-9 px-4 rounded-xl font-bold text-xs"
            >
              Reject
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onApply(item.id)}
              disabled={isProcessing}
              loading={isApplying}
              className="h-9 px-4 rounded-xl font-bold text-xs shadow-lg shadow-primary-500/20"
            >
              Apply
            </Button>
          </div>
        )}

        {/* Read-only state for decided items */}
        {isDecided && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 dark:text-slate-400">
                This suggestion has been <span className="font-bold">{item.decision}</span>
              </span>
              {item.decidedBy && (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  by {item.decidedBy}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReconciliationCard;