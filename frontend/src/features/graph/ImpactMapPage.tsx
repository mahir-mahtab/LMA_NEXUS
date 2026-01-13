/**
 * Impact Map Page - Interactive Graph Visualization
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ReactFlowProvider } from 'reactflow';
import { GraphCanvas, NodeInspector, GraphLegend } from '../../components/graph';
import { getGraph, getConnectedNodes, locateNode } from '../../services/graphService';
import { GraphState, GraphNode } from '../../types/graph';
import { LoadingSkeleton, EmptyState, Button } from '../../components/ui';
import { Toast } from '../../components/feedback';

const ImpactMapPage: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [graphState, setGraphState] = useState<GraphState | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [connectedNodes, setConnectedNodes] = useState<GraphNode[]>([]);
  const [highlightedNodeIds, setHighlightedNodeIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Load graph data
  const loadGraph = useCallback(async () => {
    if (!workspaceId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getGraph(workspaceId);
      
      if (result.success && result.graph) {
        setGraphState(result.graph);
      } else {
        setError(result.error?.message || 'Failed to load graph');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error loading graph:', err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  // Load connected nodes for selected node
  const loadConnectedNodes = useCallback(async (nodeId: string) => {
    try {
      const connected = await getConnectedNodes(nodeId);
      setConnectedNodes(connected);
      
      // Highlight connected nodes
      const connectedIds = new Set(connected.map(n => n.id));
      connectedIds.add(nodeId); // Include the selected node itself
      setHighlightedNodeIds(connectedIds);
    } catch (err) {
      console.error('Error loading connected nodes:', err);
      setConnectedNodes([]);
      setHighlightedNodeIds(new Set([nodeId]));
    }
  }, []);

  // Handle node selection
  const handleNodeSelect = useCallback(async (nodeId: string | null) => {
    setSelectedNodeId(nodeId);
    
    if (nodeId && graphState) {
      const node = graphState.nodes.find(n => n.id === nodeId);
      setSelectedNode(node || null);
      
      if (node) {
        await loadConnectedNodes(nodeId);
        
        // Update URL with selected node
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set('nodeId', nodeId);
        setSearchParams(newSearchParams, { replace: true });
      }
    } else {
      setSelectedNode(null);
      setConnectedNodes([]);
      setHighlightedNodeIds(new Set());
      
      // Remove nodeId from URL
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('nodeId');
      setSearchParams(newSearchParams, { replace: true });
    }
  }, [graphState, searchParams, setSearchParams, loadConnectedNodes]);

  // Handle locate in clause navigation
  const handleLocateInClause = useCallback(async (nodeId: string) => {
    try {
      const result = await locateNode(nodeId);
      
      if (result.success && result.clauseId) {
        // Navigate to drafting page with clause and node focus
        const params = new URLSearchParams({
          clauseId: result.clauseId,
          focus: nodeId,
        });
        
        if (result.variableId) {
          params.set('variableId', result.variableId);
        }
        
        navigate(`/app/workspaces/${workspaceId}/drafting?${params.toString()}`);
      } else {
        setToast({
          message: result.error?.message || 'Could not locate clause for this node',
          type: 'error',
        });
      }
    } catch (err) {
      console.error('Error locating node:', err);
      setToast({
        message: 'An error occurred while locating the clause',
        type: 'error',
      });
    }
  }, [workspaceId, navigate]);

  // Handle node double click (same as locate in clause)
  const handleNodeDoubleClick = useCallback((nodeId: string) => {
    handleLocateInClause(nodeId);
  }, [handleLocateInClause]);

  // Load graph on mount and workspace change
  useEffect(() => {
    loadGraph();
  }, [loadGraph]);

  // Handle deep link support (nodeId query param)
  useEffect(() => {
    const nodeIdParam = searchParams.get('nodeId');
    
    if (nodeIdParam && graphState && !selectedNodeId) {
      // Auto-select node from URL parameter
      const node = graphState.nodes.find(n => n.id === nodeIdParam);
      if (node) {
        handleNodeSelect(nodeIdParam);
      } else {
        // Node not found, remove from URL
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('nodeId');
        setSearchParams(newSearchParams, { replace: true });
      }
    }
  }, [graphState, searchParams, selectedNodeId, setSearchParams, handleNodeSelect]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (loading) {
    return (
      <div className="h-full flex bg-slate-50 dark:bg-slate-950">
        <div className="flex-1 p-6">
          <LoadingSkeleton className="h-full rounded-2xl" />
        </div>
        <div className="w-96 border-l border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900">
          <LoadingSkeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center max-w-md mx-auto px-8">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Error Loading Graph
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            {error}
          </p>
          <Button
            onClick={loadGraph}
            variant="primary"
            className="h-10 px-6 bg-primary-600 hover:bg-primary-700 text-white border-none rounded-xl shadow-lg shadow-primary-500/20 font-bold text-xs"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!graphState || graphState.nodes.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center max-w-md mx-auto px-8">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
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
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            No Graph Data
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            No nodes found in the graph. Try syncing your clauses to generate the graph.
          </p>
          <Button
            onClick={() => navigate(`/app/workspaces/${workspaceId}/drafting`)}
            variant="primary"
            className="h-10 px-6 bg-primary-600 hover:bg-primary-700 text-white border-none rounded-xl shadow-lg shadow-primary-500/20 font-bold text-xs"
          >
            Go to Drafting
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <div className="h-full flex bg-slate-50 dark:bg-slate-950">
        {/* Main Graph Area */}
        <div className="flex-1 relative">
          <GraphCanvas
            nodes={graphState.nodes}
            edges={graphState.edges}
            selectedNodeId={selectedNodeId || undefined}
            highlightedNodeIds={highlightedNodeIds}
            onNodeSelect={handleNodeSelect}
            onNodeDoubleClick={handleNodeDoubleClick}
            className="h-full"
          />
        </div>

        {/* Right Sidebar */}
        <div className="w-96 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shadow-xl">
          {/* Node Inspector */}
          <div className="flex-1 overflow-y-auto no-scrollbar">
            <NodeInspector
              selectedNode={selectedNode}
              connectedNodes={connectedNodes}
              onLocateInClause={handleLocateInClause}
            />
          </div>

          {/* Graph Legend */}
          <div className="border-t border-slate-200 dark:border-slate-800 p-4">
            <GraphLegend
              nodeCount={graphState.nodes.length}
              edgeCount={graphState.edges.length}
              integrityScore={graphState.integrityScore}
            />
          </div>
        </div>

        {/* Toast Notifications */}
        {toast && (
          <Toast
            id="impact-map-toast"
            variant={toast.type}
            title={toast.type === 'success' ? 'Success' : 'Error'}
            message={toast.message}
            onDismiss={() => setToast(null)}
            duration={5000}
          />
        )}
      </div>
    </ReactFlowProvider>
  );
};

export default ImpactMapPage;