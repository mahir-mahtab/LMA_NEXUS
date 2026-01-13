/**
 * NodeInspector Component
 * Displays detailed information about a selected graph node
 * Requirements: 6.2, 6.3
 */

import React from 'react';
import { GraphNode } from '../../types/graph';
import { Badge, Button, EmptyState } from '../ui';

interface NodeInspectorProps {
  selectedNode: GraphNode | null;
  connectedNodes: GraphNode[];
  onLocateInClause?: (nodeId: string) => void;
  className?: string;
}

const NodeInspector: React.FC<NodeInspectorProps> = ({
  selectedNode,
  connectedNodes,
  onLocateInClause,
  className = '',
}) => {
  if (!selectedNode) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 mb-6 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            No Node Selected
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-xs">
            Click on a node in the graph to view its details and dependencies.
          </p>
        </div>
      </div>
    );
  }

  const handleLocateClick = () => {
    if (onLocateInClause) {
      onLocateInClause(selectedNode.id);
    }
  };

  // Get node type display info
  const getNodeTypeInfo = (type: string) => {
    switch (type) {
      case 'financial':
        return { label: 'Financial', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' };
      case 'covenant':
        return { label: 'Covenant', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' };
      case 'definition':
        return { label: 'Definition', color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20' };
      case 'xref':
        return { label: 'Cross-Reference', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' };
      default:
        return { label: type, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-800' };
    }
  };

  const typeInfo = getNodeTypeInfo(selectedNode.type);

  return (
    <div className={`p-4 space-y-4 ${className}`}>
      {/* Node Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight truncate">
              {selectedNode.label}
            </h3>
            {selectedNode.value && (
              <p className="mt-1 text-sm font-mono text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-lg px-2 py-1 inline-block">
                {selectedNode.value}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
            {selectedNode.hasDrift && (
              <div className="flex items-center space-x-1.5 px-2 py-1 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">Drift</span>
              </div>
            )}
            {selectedNode.hasWarning && (
              <div className="flex items-center space-x-1.5 px-2 py-1 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Warning</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Badge variant="status" value={typeInfo.label} className="font-bold border-none" />
        </div>
      </div>

      {/* Node Details */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 space-y-3">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
          Node Details
        </h4>
        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Type</span>
            <span className={`font-bold ${typeInfo.color}`}>
              {typeInfo.label}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400 font-medium">ID</span>
            <span className="font-mono text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded truncate max-w-[140px]">
              {selectedNode.id}
            </span>
          </div>
          {selectedNode.clauseId && (
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Clause</span>
              <span className="font-mono text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded truncate max-w-[140px]">
                {selectedNode.clauseId}
              </span>
            </div>
          )}
          {selectedNode.variableId && (
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Variable</span>
              <span className="font-mono text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded truncate max-w-[140px]">
                {selectedNode.variableId}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Dependencies */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Dependencies
          </h4>
          <span className="text-[10px] font-bold text-slate-500 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full">
            {connectedNodes.length}
          </span>
        </div>
        {connectedNodes.length > 0 ? (
          <div className="space-y-2">
            {connectedNodes.map((node) => {
              const connectedTypeInfo = getNodeTypeInfo(node.type);
              return (
                <div
                  key={node.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 group hover:shadow-md transition-shadow"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {node.label}
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="status" value={connectedTypeInfo.label} className="text-[10px] font-bold border-none" />
                      {node.hasDrift && (
                        <div
                          className="w-2 h-2 rounded-full bg-red-500"
                          title="Has drift"
                        />
                      )}
                      {node.hasWarning && (
                        <div
                          className="w-2 h-2 rounded-full bg-amber-500"
                          title="Has warning"
                        />
                      )}
                    </div>
                  </div>
                  {node.value && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono ml-2 bg-slate-50 dark:bg-slate-900 px-2 py-0.5 rounded">
                      {node.value}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">
            <svg className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            No connected nodes
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="pt-2">
        <Button
          onClick={handleLocateClick}
          variant="primary"
          size="sm"
          className="w-full h-10 bg-primary-600 hover:bg-primary-700 text-white border-none rounded-xl shadow-lg shadow-primary-500/20 font-bold text-xs"
          disabled={!selectedNode.clauseId && !selectedNode.variableId}
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          Locate in Clause
        </Button>
      </div>
    </div>
  );
};

export default NodeInspector;