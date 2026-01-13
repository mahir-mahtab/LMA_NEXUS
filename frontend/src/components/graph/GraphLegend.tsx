/**
 * GraphLegend Component
 * Displays node type color mapping and graph information
 * Requirements: 6.1
 */

import React from 'react';
import { NodeType } from '../../types/graph';
import { Badge } from '../ui';

interface GraphLegendProps {
  nodeCount?: number;
  edgeCount?: number;
  integrityScore?: number;
  className?: string;
}

interface LegendItem {
  type: NodeType;
  label: string;
  description: string;
  color: string;
  borderColor: string;
  icon: React.ReactNode;
}

const LEGEND_ITEMS: LegendItem[] = [
  {
    type: 'financial',
    label: 'Financial',
    description: 'Financial terms and calculations',
    color: 'bg-emerald-100 dark:bg-emerald-900/30',
    borderColor: 'border-emerald-400',
    icon: (
      <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    type: 'covenant',
    label: 'Covenant',
    description: 'Loan covenants and ratios',
    color: 'bg-blue-100 dark:bg-blue-900/30',
    borderColor: 'border-blue-400',
    icon: (
      <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    type: 'definition',
    label: 'Definition',
    description: 'Term definitions and references',
    color: 'bg-violet-100 dark:bg-violet-900/30',
    borderColor: 'border-violet-400',
    icon: (
      <svg className="w-3.5 h-3.5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    type: 'xref',
    label: 'Cross-Reference',
    description: 'Cross-references and links',
    color: 'bg-amber-100 dark:bg-amber-900/30',
    borderColor: 'border-amber-400',
    icon: (
      <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
  },
];

const GraphLegend: React.FC<GraphLegendProps> = ({
  nodeCount = 0,
  edgeCount = 0,
  integrityScore = 0,
  className = '',
}) => {
  const getIntegrityColor = (score: number) => {
    if (score >= 90) return { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', label: 'Excellent' };
    if (score >= 70) return { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', label: 'Good' };
    return { text: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', label: 'Needs Attention' };
  };

  const integrityInfo = getIntegrityColor(integrityScore);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Graph Statistics - Compact */}
      <div className="grid grid-cols-3 gap-2">
        {/* Integrity Score */}
        <div className={`p-3 rounded-xl ${integrityInfo.bg} text-center`}>
          <div className={`text-lg font-extrabold ${integrityInfo.text}`}>
            {integrityScore}%
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-0.5">
            Integrity
          </div>
        </div>

        {/* Node Count */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-center">
          <div className="text-lg font-extrabold text-slate-900 dark:text-white">
            {nodeCount}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-0.5">
            Nodes
          </div>
        </div>

        {/* Edge Count */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-center">
          <div className="text-lg font-extrabold text-slate-900 dark:text-white">
            {edgeCount}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-0.5">
            Edges
          </div>
        </div>
      </div>

      {/* Node Types Legend - Compact Grid */}
      <div>
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
          Node Types
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {LEGEND_ITEMS.map((item) => (
            <div
              key={item.type}
              className={`flex items-center space-x-2 p-2 rounded-xl ${item.color} border ${item.borderColor}`}
            >
              {item.icon}
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Status Indicators - Inline */}
      <div className="flex items-center justify-center space-x-4 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-1.5">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-medium text-slate-500">Drift</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-2 h-2 bg-amber-500 rounded-full" />
          <span className="text-[10px] font-medium text-slate-500">Warning</span>
        </div>
      </div>
    </div>
  );
};

export default GraphLegend;