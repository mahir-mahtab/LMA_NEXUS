/**
 * CustomNode Component
 * Custom node renderer for React Flow graph
 * Requirements: 6.1, 6.2
 */

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { GraphNode } from '../../types/graph';
import { Badge } from '../ui';

interface CustomNodeData extends GraphNode {
  colors: {
    bg: string;
    border: string;
    text: string;
  };
  isSelected: boolean;
  isHighlighted?: boolean;
  isDimmed?: boolean;
}

const CustomNode: React.FC<NodeProps<CustomNodeData>> = memo(({ data, selected }) => {
  const { 
    label, 
    type, 
    value, 
    hasDrift, 
    hasWarning, 
    colors, 
    isSelected, 
    isHighlighted = false,
    isDimmed = false 
  } = data;

  return (
    <div
      className={`
        relative min-w-[150px] max-w-[240px] p-4 rounded-2xl border-2 backdrop-blur-sm
        transition-all duration-300 ease-out cursor-pointer select-none
        ${colors.bg} ${colors.border} ${colors.text}
        ${isSelected || selected ? 'ring-2 ring-primary-500 ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-950 shadow-xl scale-105' : ''}
        ${isHighlighted ? 'ring-2 ring-indigo-400/50 ring-offset-1 ring-offset-slate-50 dark:ring-offset-slate-950 shadow-xl scale-102' : ''}
        ${isDimmed ? 'opacity-30 scale-95' : 'opacity-100'}
        hover:shadow-lg hover:scale-[1.03] active:scale-[0.98]
        shadow-md
      `}
    >
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-slate-300 dark:!bg-slate-600 !border-2 !border-slate-400 dark:!border-slate-500 !-top-1.5 opacity-0 hover:opacity-100 transition-opacity duration-200"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-slate-300 dark:!bg-slate-600 !border-2 !border-slate-400 dark:!border-slate-500 !-bottom-1.5 opacity-0 hover:opacity-100 transition-opacity duration-200"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-slate-300 dark:!bg-slate-600 !border-2 !border-slate-400 dark:!border-slate-500 !-left-1.5 opacity-0 hover:opacity-100 transition-opacity duration-200"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-slate-300 dark:!bg-slate-600 !border-2 !border-slate-400 dark:!border-slate-500 !-right-1.5 opacity-0 hover:opacity-100 transition-opacity duration-200"
      />

      {/* Node content */}
      <div className="space-y-2.5">
        {/* Node type badge and status indicators */}
        <div className="flex items-center justify-between">
          <Badge 
            variant="status" 
            value={type.toUpperCase()} 
            className="text-[10px] font-bold uppercase tracking-wider border-none shadow-sm" 
          />
          
          {/* Status indicators */}
          {(hasDrift || hasWarning) && (
            <div className="flex items-center space-x-1.5">
              {hasDrift && (
                <div
                  className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-sm shadow-red-500/50"
                  title="Has drift"
                />
              )}
              {hasWarning && (
                <div
                  className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50"
                  title="Has warning"
                />
              )}
            </div>
          )}
        </div>

        {/* Node label */}
        <div className="font-bold text-sm leading-tight break-words">
          {label}
        </div>

        {/* Node value (if present) */}
        {value && (
          <div className="text-xs opacity-80 font-mono break-all bg-white/50 dark:bg-slate-900/30 rounded-lg px-2 py-1">
            {value}
          </div>
        )}
      </div>
    </div>
  );
});

CustomNode.displayName = 'CustomNode';

export default CustomNode;