/**
 * ClauseOutline - Searchable clause list with selection
 * Requirements: 4.1
 */

import React, { useState, useMemo } from 'react';
import { OutlineItem } from '../../services/draftService';
import { Badge, Input, EmptyState } from '../ui';
import { clsx } from 'clsx';

interface ClauseOutlineProps {
  clauses: OutlineItem[];
  activeClauseId?: string;
  onClauseSelect: (clauseId: string) => void;
  loading?: boolean;
}

const ClauseOutline: React.FC<ClauseOutlineProps> = ({
  clauses,
  activeClauseId,
  onClauseSelect,
  loading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter clauses based on search term
  const filteredClauses = useMemo(() => {
    if (!searchTerm.trim()) {
      return clauses;
    }

    const term = searchTerm.toLowerCase();
    return clauses.filter(clause =>
      clause.title.toLowerCase().includes(term) ||
      clause.type.toLowerCase().includes(term)
    );
  }, [clauses, searchTerm]);

  if (loading) {
    return (
      <div className="h-full flex flex-col bg-white dark:bg-slate-900">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse"></div>
        </div>
        <div className="flex-1 p-4 space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-50 dark:bg-slate-800/50 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900">
      {/* Search Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-slate-400 group-focus-within:text-primary-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <Input
            type="text"
            placeholder="Search clauses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 h-10 text-sm bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
      </div>

      {/* Clause List */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-3">
        {filteredClauses.length === 0 ? (
          <div className="py-12">
            {searchTerm ? (
              <EmptyState
                title="No clauses found"
                description={`No clauses match "${searchTerm}"`}
                size="sm"
              />
            ) : (
              <EmptyState
                title="No clauses"
                description="No clauses available in this workspace"
                size="sm"
              />
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredClauses.map((clause) => (
              <button
                key={clause.id}
                onClick={() => onClauseSelect(clause.id)}
                className={clsx(
                  "w-full text-left p-3.5 rounded-xl transition-all duration-200 border group relative",
                  activeClauseId === clause.id
                    ? "bg-primary-50 dark:bg-primary-900/10 border-primary-200 dark:border-primary-800 shadow-sm"
                    : "bg-white dark:bg-slate-900 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-200 dark:hover:border-slate-800",
                  clause.isLocked && "opacity-60"
                )}
              >
                {activeClauseId === clause.id && (
                  <div className="absolute left-0 top-3 bottom-3 w-1 bg-primary-600 rounded-r-full"></div>
                )}
                
                <div className="flex items-start justify-between mb-2.5">
                  <h3 className={clsx(
                    "text-sm font-bold truncate pr-2 transition-colors",
                    activeClauseId === clause.id
                      ? "text-primary-700 dark:text-primary-400"
                      : "text-slate-900 dark:text-slate-100 group-hover:text-primary-600"
                  )}>
                    {clause.title}
                  </h3>
                  <div className="flex items-center space-x-1.5 flex-shrink-0">
                    {clause.isSensitive && (
                      <div className="w-2 h-2 bg-danger-500 rounded-full shadow-sm shadow-danger-500/50" title="Sensitive clause" />
                    )}
                    {clause.isLocked && (
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <Badge
                    variant="status"
                    value={clause.type}
                    className="font-bold border-none"
                  />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    #{clause.order}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClauseOutline;