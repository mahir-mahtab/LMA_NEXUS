/**
 * ClauseEditor - Clause text editor with autosave and read-only mode
 * Requirements: 4.2, 4.5
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Clause } from '../../types/document';
import { Textarea, Badge, EmptyState, Button } from '../ui';
import { 
  hasNewFinancialPatterns, 
  getSuggestedVariableLabel,
  getSuggestedVariableType,
  FinancialPattern 
} from '../../utils/financialPatterns';

interface ClauseEditorProps {
  clause: Clause | null;
  canEdit: boolean;
  onSave: (clauseId: string, newBody: string) => Promise<void>;
  onSuggestVariable?: (suggestion: {
    label: string;
    type: 'financial' | 'covenant' | 'ratio';
    value: string;
    unit?: string;
  }) => void;
  onSyncToGraph?: () => void;
  onViewInGraph?: (clauseId: string) => void;
  loading?: boolean;
  saving?: boolean;
  syncing?: boolean;
}

const ClauseEditor: React.FC<ClauseEditorProps> = ({
  clause,
  canEdit,
  onSave,
  onSuggestVariable,
  onSyncToGraph,
  onViewInGraph,
  loading = false,
  saving = false,
  syncing = false,
}) => {
  const [body, setBody] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [detectedPatterns, setDetectedPatterns] = useState<FinancialPattern[]>([]);
  const [showPatternSuggestion, setShowPatternSuggestion] = useState(false);
  const previousBodyRef = useRef('');

  // Update body when clause changes
  useEffect(() => {
    if (clause) {
      setBody(clause.body);
      setHasUnsavedChanges(false);
      previousBodyRef.current = clause.body;
    } else {
      setBody('');
      setHasUnsavedChanges(false);
      previousBodyRef.current = '';
    }
    setShowPatternSuggestion(false);
    setDetectedPatterns([]);
  }, [clause]);

  // Auto-save functionality
  const handleSave = useCallback(async () => {
    if (!clause || !hasUnsavedChanges || saving) {
      return;
    }

    try {
      await onSave(clause.id, body);
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save clause:', error);
    }
  }, [clause, body, hasUnsavedChanges, saving, onSave]);

  // Auto-save after 2 seconds of inactivity
  useEffect(() => {
    if (!hasUnsavedChanges || !canEdit) {
      return;
    }

    const timeoutId = setTimeout(handleSave, 2000);
    return () => clearTimeout(timeoutId);
  }, [hasUnsavedChanges, canEdit, handleSave]);

  // Handle text changes
  const handleBodyChange = (value: string) => {
    const previousBody = previousBodyRef.current;
    setBody(value);
    setHasUnsavedChanges(clause ? value !== clause.body : false);
    
    // Detect new financial patterns
    if (canEdit && onSuggestVariable) {
      const newPatterns = hasNewFinancialPatterns(value, previousBody);
      if (newPatterns.length > 0) {
        setDetectedPatterns(newPatterns);
        setShowPatternSuggestion(true);
        
        // Auto-hide suggestion after 10 seconds
        setTimeout(() => {
          setShowPatternSuggestion(false);
        }, 10000);
      }
    }
    
    previousBodyRef.current = value;
  };

  // Handle pattern suggestion acceptance
  const handleAcceptSuggestion = (pattern: FinancialPattern) => {
    if (onSuggestVariable) {
      onSuggestVariable({
        label: getSuggestedVariableLabel(pattern),
        type: getSuggestedVariableType(pattern),
        value: pattern.value,
        unit: pattern.unit,
      });
    }
    setShowPatternSuggestion(false);
  };

  // Handle pattern suggestion dismissal
  const handleDismissSuggestion = () => {
    setShowPatternSuggestion(false);
  };

  const formatLastModified = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col bg-white dark:bg-slate-900">
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800">
          <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse mb-4 w-1/2"></div>
          <div className="h-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg animate-pulse w-1/3"></div>
        </div>
        <div className="flex-1 p-8">
          <div className="h-full bg-slate-50 dark:bg-slate-800/50 rounded-2xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!clause) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-slate-900">
        <EmptyState
          title="No clause selected"
          description="Select a clause from the outline to begin editing"
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white truncate" title={clause.title}>
                {clause.title}
              </h1>
            </div>
            
            {/* Action buttons */}
            {canEdit && (
              <div className="flex items-center space-x-3">
                {onSyncToGraph && (
                  <Button
                    onClick={onSyncToGraph}
                    size="sm"
                    variant="primary"
                    disabled={syncing || saving}
                    loading={syncing}
                    className="h-9 px-4 bg-primary-600 hover:bg-primary-700 text-white border-none rounded-xl shadow-lg shadow-primary-500/20 font-bold text-xs"
                  >
                    {syncing ? 'Syncing...' : 'Sync to Graph'}
                  </Button>
                )}
                {onViewInGraph && (
                  <Button
                    onClick={() => onViewInGraph(clause.id)}
                    size="sm"
                    variant="secondary"
                    disabled={syncing || saving}
                    className="h-9 px-4 border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs"
                  >
                    View in Impact Map
                  </Button>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Badge
              variant="status"
              value={clause.type}
              className="font-bold border-none"
            />
            {clause.isSensitive && (
              <Badge variant="severity" value="Sensitive" className="font-bold border-none" />
            )}
            {clause.isLocked && (
              <Badge variant="status" value="Locked" className="font-bold border-none bg-slate-100 dark:bg-slate-800 text-slate-500" />
            )}
          </div>
        </div>

        {/* Status indicators */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-6 text-slate-500 dark:text-slate-400 font-medium">
            <div className="flex items-center">
              <span className="text-[10px] font-bold uppercase tracking-widest mr-2 text-slate-400">Order</span>
              <span className="text-slate-900 dark:text-slate-200">#{clause.order}</span>
            </div>
            <div className="flex items-center">
              <span className="text-[10px] font-bold uppercase tracking-widest mr-2 text-slate-400">Modified</span>
              <span className="text-slate-900 dark:text-slate-200">{formatLastModified(clause.lastModifiedAt)}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {!canEdit && (
              <Badge variant="status" value="Read-only" className="text-[10px] font-bold uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-500 border-none" />
            )}
            {syncing && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-primary-50 dark:bg-primary-900/20 rounded-full border border-primary-100 dark:border-primary-900/30">
                <div className="w-1.5 h-1.5 bg-primary-600 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary-700 dark:text-primary-400">Syncing...</span>
              </div>
            )}
            {saving && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-full border border-emerald-100 dark:border-emerald-900/30">
                <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">Saving...</span>
              </div>
            )}
            {hasUnsavedChanges && !saving && !syncing && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-amber-50 dark:bg-amber-900/20 rounded-full border border-amber-100 dark:border-amber-900/30">
                <div className="w-1.5 h-1.5 bg-amber-600 rounded-full"></div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">Unsaved changes</span>
              </div>
            )}
            {lastSaved && !hasUnsavedChanges && !saving && !syncing && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-slate-50 dark:bg-slate-800/50 rounded-full border border-slate-200 dark:border-slate-700">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 p-8 relative overflow-hidden">
        <div className="h-full bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-inner relative group">
          <Textarea
            value={body}
            onChange={(e) => handleBodyChange(e.target.value)}
            placeholder={canEdit ? "Enter clause text..." : "No content available"}
            disabled={!canEdit || clause?.isLocked}
            className="w-full h-full resize-none font-mono text-base leading-relaxed bg-transparent border-none focus:ring-0 p-0 text-slate-700 dark:text-slate-300 no-scrollbar"
            rows={20}
          />
          
          {/* Subtle overlay for read-only/locked */}
          {(!canEdit || clause?.isLocked) && (
            <div className="absolute inset-0 bg-slate-50/10 dark:bg-slate-900/10 pointer-events-none"></div>
          )}
        </div>
        
        {/* Financial Pattern Suggestion Toast */}
        {showPatternSuggestion && detectedPatterns.length > 0 && (
          <div className="absolute bottom-12 right-12 bg-white dark:bg-slate-800 border border-primary-200 dark:border-primary-800 rounded-2xl p-5 shadow-2xl shadow-primary-500/10 max-w-sm animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                  Financial Pattern Detected
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                  Found <span className="font-bold text-primary-600 dark:text-primary-400">"{detectedPatterns[0].pattern}"</span>. Would you like to bind this as a variable?
                </p>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleAcceptSuggestion(detectedPatterns[0])}
                    className="h-8 px-4 bg-primary-600 hover:bg-primary-700 text-white border-none rounded-lg font-bold text-xs"
                  >
                    Bind Variable
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleDismissSuggestion}
                    className="h-8 px-4 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-bold text-xs"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-6 flex items-center justify-between">
          <div>
            {!canEdit && (
              <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 italic">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Read-only access. Contact administrator for edit permissions.
              </div>
            )}
            
            {clause?.isLocked && canEdit && (
              <div className="flex items-center text-sm text-amber-600 dark:text-amber-400 italic">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                This clause is locked and cannot be edited.
              </div>
            )}
          </div>
          
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {body.length} characters • {body.split(/\s+/).filter(Boolean).length} words
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClauseEditor;