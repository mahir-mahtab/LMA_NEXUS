/**
 * InspectorPanel - Clause inspection with variables, intelligence, and warnings
 * Requirements: 4.1, 4.4
 */

import React, { useState } from 'react';
import { Variable } from '../../types/document';
import { Badge, Button, EmptyState } from '../ui';

interface InspectorPanelProps {
  clauseId?: string;
  variables: Variable[];
  onVariableEdit?: (variable: Variable) => void;
  onVariableAdd?: () => void;
  canEditVariables?: boolean;
  loading?: boolean;
}

interface InspectorSection {
  id: string;
  title: string;
  isExpanded: boolean;
}

const InspectorPanel: React.FC<InspectorPanelProps> = ({
  clauseId,
  variables,
  onVariableEdit,
  onVariableAdd,
  canEditVariables = false,
  loading = false,
}) => {
  const [sections, setSections] = useState<InspectorSection[]>([
    { id: 'variables', title: 'Bound Variables', isExpanded: true },
    { id: 'intelligence', title: 'Clause Intelligence', isExpanded: false },
    { id: 'warnings', title: 'Warnings', isExpanded: false },
  ]);

  const toggleSection = (sectionId: string) => {
    setSections(prev => prev.map(section =>
      section.id === sectionId
        ? { ...section, isExpanded: !section.isExpanded }
        : section
    ));
  };

  const formatValue = (value: string, unit?: string) => {
    if (unit) {
      return `${value} ${unit}`;
    }
    return value;
  };

  // Mock intelligence data
  const mockIntelligence = [
    {
      type: 'suggestion',
      title: 'Financial Pattern Detected',
      description: 'Consider binding "2.50%" as a variable for easier tracking.',
    },
    {
      type: 'info',
      title: 'Cross-Reference Found',
      description: 'This clause references Section 3.2 (Interest Rate Calculation).',
    },
  ];

  // Mock warnings data
  const mockWarnings = [
    {
      type: 'warning',
      title: 'Potential Inconsistency',
      description: 'The interest rate differs from the term sheet baseline.',
    },
  ];

  if (loading) {
    return (
      <div className="h-full bg-slate-50 dark:bg-slate-950">
        <div className="p-4 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 space-y-3">
              <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse w-1/2"></div>
              <div className="h-20 bg-slate-50 dark:bg-slate-800/50 rounded-xl animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!clauseId) {
    return (
      <div className="h-full bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-8">
        <EmptyState
          title="No clause selected"
          description="Select a clause to view its details"
        />
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-50 dark:bg-slate-950 overflow-y-auto no-scrollbar">
      <div className="p-4 space-y-4">
        {/* Bound Variables Section */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <button
            onClick={() => toggleSection('variables')}
            className="w-full p-4 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-50 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Bound Variables ({variables.length})
              </h3>
            </div>
            <svg
              className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${
                sections.find(s => s.id === 'variables')?.isExpanded ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {sections.find(s => s.id === 'variables')?.isExpanded && (
            <div className="border-t border-slate-100 dark:border-slate-800 p-4 bg-slate-50/30 dark:bg-slate-900/30">
              {variables.length === 0 ? (
                <div className="py-4">
                  <EmptyState
                    title="No variables bound"
                    description="Bind variables to track key values in this clause"
                    size="sm"
                    action={canEditVariables ? (
                      <Button
                        onClick={onVariableAdd}
                        size="sm"
                        variant="primary"
                        className="mt-4 bg-primary-600 hover:bg-primary-700 text-white border-none rounded-xl shadow-lg shadow-primary-500/20 font-bold text-xs"
                      >
                        Add Variable
                      </Button>
                    ) : undefined}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  {variables.map((variable) => (
                    <div
                      key={variable.id}
                      className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm group relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 w-1 h-full bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate pr-2">
                          {variable.label}
                        </h4>
                        <Badge
                          variant="status"
                          value={variable.type}
                          className="font-bold border-none"
                        />
                      </div>
                      
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Current Value</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 px-2 py-0.5 rounded">
                            {formatValue(variable.value, variable.unit)}
                          </span>
                        </div>
                        
                        {variable.baselineValue && variable.baselineValue !== variable.value && (
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">Baseline</span>
                            <span className="font-mono text-slate-500 dark:text-slate-500 line-through">
                              {formatValue(variable.baselineValue, variable.unit)}
                            </span>
                          </div>
                        )}
                      </div>

                      {canEditVariables && onVariableEdit && (
                        <div className="mt-4 flex space-x-2">
                          <Button
                            onClick={() => onVariableEdit(variable)}
                            size="sm"
                            variant="secondary"
                            className="h-8 px-3 border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 font-bold text-[10px] uppercase tracking-wider"
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-3 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-bold text-[10px] uppercase tracking-wider"
                          >
                            View Usage
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}

                  {canEditVariables && onVariableAdd && (
                    <Button
                      onClick={onVariableAdd}
                      size="sm"
                      variant="secondary"
                      className="w-full h-10 border-dashed border-2 border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-xs text-slate-500"
                    >
                      + Add Variable
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Clause Intelligence Section */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <button
            onClick={() => toggleSection('intelligence')}
            className="w-full p-4 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Clause Intelligence
              </h3>
            </div>
            <svg
              className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${
                sections.find(s => s.id === 'intelligence')?.isExpanded ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {sections.find(s => s.id === 'intelligence')?.isExpanded && (
            <div className="border-t border-slate-100 dark:border-slate-800 p-4 space-y-3">
              {mockIntelligence.length === 0 ? (
                <EmptyState
                  title="No insights available"
                  description="AI analysis will appear here when available"
                  size="sm"
                />
              ) : (
                <div className="space-y-3">
                  {mockIntelligence.map((item, index) => (
                    <div
                      key={index}
                      className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-900/30 group"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5 flex-shrink-0 shadow-sm shadow-indigo-500/50"></div>
                        <div>
                          <h4 className="font-bold text-indigo-900 dark:text-indigo-300 text-sm">
                            {item.title}
                          </h4>
                          <p className="text-xs text-indigo-700 dark:text-indigo-400/80 mt-1.5 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Warnings Section */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <button
            onClick={() => toggleSection('warnings')}
            className="w-full p-4 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Warnings
              </h3>
            </div>
            <svg
              className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${
                sections.find(s => s.id === 'warnings')?.isExpanded ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {sections.find(s => s.id === 'warnings')?.isExpanded && (
            <div className="border-t border-slate-100 dark:border-slate-800 p-4 space-y-3">
              {mockWarnings.length === 0 ? (
                <EmptyState
                  title="No warnings"
                  description="All checks passed for this clause"
                  size="sm"
                />
              ) : (
                <div className="space-y-3">
                  {mockWarnings.map((item, index) => (
                    <div
                      key={index}
                      className="p-4 bg-amber-50/50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/30 group"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-amber-500 rounded-full mt-1.5 flex-shrink-0 shadow-sm shadow-amber-500/50"></div>
                        <div>
                          <h4 className="font-bold text-amber-900 dark:text-amber-300 text-sm">
                            {item.title}
                          </h4>
                          <p className="text-xs text-amber-700 dark:text-amber-400/80 mt-1.5 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InspectorPanel;