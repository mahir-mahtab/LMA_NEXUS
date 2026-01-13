/**
 * GlobalSearch Component
 * Global search functionality for clauses and variables from the top bar
 * Requirements: 4.1
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../../stores/WorkspaceProvider';
import { getDocumentOutline, getVariablesForClause } from '../../services/draftService';
import { OutlineItem } from '../../services/draftService';
import { Variable } from '../../types/document';
import { Input, Badge, EmptyState } from '../ui';

interface SearchResult {
  id: string;
  type: 'clause' | 'variable';
  title: string;
  subtitle?: string;
  clauseId?: string;
  variableId?: string;
  clauseType?: string;
  variableType?: string;
}

interface GlobalSearchProps {
  className?: string;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ className }) => {
  const navigate = useNavigate();
  const { activeWorkspaceId } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Search data
  const [clauses, setClauses] = useState<OutlineItem[]>([]);
  const [variables, setVariables] = useState<Variable[]>([]);

  // Load search data when workspace changes
  useEffect(() => {
    const loadSearchData = async () => {
      if (!activeWorkspaceId) return;

      try {
        // Load clauses
        const clauseData = await getDocumentOutline(activeWorkspaceId);
        setClauses(clauseData);

        // Load all variables for all clauses
        const allVariables: Variable[] = [];
        for (const clause of clauseData) {
          try {
            const clauseVariables = await getVariablesForClause(clause.id);
            if (clauseVariables) {
              allVariables.push(...clauseVariables);
            }
          } catch (error) {
            // Continue if a clause fails to load variables
            console.warn(`Failed to load variables for clause ${clause.id}:`, error);
          }
        }
        setVariables(allVariables);
      } catch (error) {
        console.error('Failed to load search data:', error);
      }
    };

    loadSearchData();
  }, [activeWorkspaceId]);

  // Perform search
  const performSearch = useCallback((term: string) => {
    if (!term.trim()) {
      setResults([]);
      return;
    }

    const searchResults: SearchResult[] = [];
    const lowerTerm = term.toLowerCase();

    // Search clauses
    clauses.forEach(clause => {
      if (clause.title.toLowerCase().includes(lowerTerm) || 
          clause.type.toLowerCase().includes(lowerTerm)) {
        searchResults.push({
          id: `clause-${clause.id}`,
          type: 'clause',
          title: clause.title,
          subtitle: `${clause.type} • Order #${clause.order}`,
          clauseId: clause.id,
          clauseType: clause.type,
        });
      }
    });

    // Search variables
    variables.forEach(variable => {
      const clause = clauses.find(c => c.id === variable.clauseId);
      if (variable.label.toLowerCase().includes(lowerTerm) ||
          variable.type.toLowerCase().includes(lowerTerm) ||
          variable.value.toLowerCase().includes(lowerTerm)) {
        searchResults.push({
          id: `variable-${variable.id}`,
          type: 'variable',
          title: variable.label,
          subtitle: `${variable.type} • ${variable.value}${variable.unit ? ` ${variable.unit}` : ''} • ${clause?.title || 'Unknown Clause'}`,
          clauseId: variable.clauseId,
          variableId: variable.id,
          variableType: variable.type,
        });
      }
    });

    // Sort results by relevance (exact matches first, then partial matches)
    searchResults.sort((a, b) => {
      const aExact = a.title.toLowerCase() === lowerTerm;
      const bExact = b.title.toLowerCase() === lowerTerm;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      const aStarts = a.title.toLowerCase().startsWith(lowerTerm);
      const bStarts = b.title.toLowerCase().startsWith(lowerTerm);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      
      return a.title.localeCompare(b.title);
    });

    setResults(searchResults.slice(0, 10)); // Limit to 10 results
  }, [clauses, variables]);

  // Handle search input changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      setSelectedIndex(-1);
      return;
    }

    setLoading(true);
    const timeoutId = setTimeout(() => {
      performSearch(searchTerm);
      setLoading(false);
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm, performSearch]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleResultClick(results[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        handleClose();
        break;
    }
  };

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    if (!activeWorkspaceId) return;

    if (result.type === 'clause' && result.clauseId) {
      navigate(`/app/workspaces/${activeWorkspaceId}/drafting?clauseId=${result.clauseId}&focus=search`);
    } else if (result.type === 'variable' && result.clauseId && result.variableId) {
      navigate(`/app/workspaces/${activeWorkspaceId}/drafting?clauseId=${result.clauseId}&variableId=${result.variableId}&focus=search`);
    }

    handleClose();
  };

  // Handle opening search
  const handleOpen = () => {
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  // Handle closing search
  const handleClose = () => {
    setIsOpen(false);
    setSearchTerm('');
    setResults([]);
    setSelectedIndex(-1);
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyboardShortcut = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          handleClose();
        } else {
          handleOpen();
        }
      }
    };

    document.addEventListener('keydown', handleKeyboardShortcut);
    return () => document.removeEventListener('keydown', handleKeyboardShortcut);
  }, [isOpen]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'financial':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'covenant':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'definition':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'xref':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'ratio':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  if (!activeWorkspaceId) return null;

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Trigger Button */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-800 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span>Search clauses & variables</span>
          <div className="hidden sm:flex items-center space-x-1 text-xs">
            <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded text-gray-500 dark:text-gray-400">
              ⌘K
            </kbd>
          </div>
        </button>
      )}

      {/* Search Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-start justify-center p-4 pt-16">
            <div className="fixed inset-0 bg-black bg-opacity-25 transition-opacity" />
            
            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-lg shadow-xl">
              {/* Search Input */}
              <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Search clauses and variables..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full"
                />
              </div>

              {/* Search Results */}
              <div ref={resultsRef} className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center">
                    <div className="animate-spin w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Searching...</p>
                  </div>
                ) : results.length === 0 ? (
                  <div className="p-4">
                    {searchTerm.trim() ? (
                      <EmptyState
                        title="No results found"
                        description={`No clauses or variables match "${searchTerm}"`}
                        size="sm"
                      />
                    ) : (
                      <EmptyState
                        title="Start typing to search"
                        description="Search for clauses and variables across your workspace"
                        size="sm"
                      />
                    )}
                  </div>
                ) : (
                  <div className="py-2">
                    {results.map((result, index) => (
                      <button
                        key={result.id}
                        onClick={() => handleResultClick(result)}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors ${
                          index === selectedIndex ? 'bg-gray-50 dark:bg-slate-700' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          {/* Icon */}
                          <div className="flex-shrink-0 mt-1">
                            {result.type === 'clause' ? (
                              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a1.994 1.994 0 01-1.414.586H7a4 4 0 01-4-4V7a4 4 0 014-4z" />
                              </svg>
                            )}
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {result.title}
                              </p>
                              <Badge
                                variant="status"
                                value={result.type}
                                className="text-xs"
                              />
                              {(result.clauseType || result.variableType) && (
                                <Badge
                                  variant="status"
                                  value={result.clauseType || result.variableType || ''}
                                  className={`text-xs ${getTypeColor(result.clauseType || result.variableType || '')}`}
                                />
                              )}
                            </div>
                            {result.subtitle && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {result.subtitle}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-3 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700 rounded-b-lg">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-600 border border-gray-300 dark:border-slate-500 rounded">↑↓</kbd>
                      <span>Navigate</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-600 border border-gray-300 dark:border-slate-500 rounded">↵</kbd>
                      <span>Select</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-600 border border-gray-300 dark:border-slate-500 rounded">esc</kbd>
                      <span>Close</span>
                    </div>
                  </div>
                  <span>{results.length} result{results.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;