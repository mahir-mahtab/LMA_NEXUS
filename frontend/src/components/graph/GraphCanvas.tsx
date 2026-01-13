/**
 * GraphCanvas Component
 * Interactive graph visualization using React Flow
 * Requirements: 6.1
 */

import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  NodeTypes,
  MarkerType,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { GraphNode, GraphEdge, NodeType } from '../../types/graph';
import CustomNode from './CustomNode';

interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodeId?: string;
  highlightedNodeIds?: Set<string>;
  onNodeSelect?: (nodeId: string | null) => void;
  onNodeDoubleClick?: (nodeId: string) => void;
  className?: string;
}

// Node type colors mapping - premium palette
const NODE_TYPE_COLORS: Record<NodeType, { bg: string; border: string; text: string }> = {
  financial: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-400 dark:border-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-300',
  },
  covenant: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-400 dark:border-blue-500',
    text: 'text-blue-700 dark:text-blue-300',
  },
  definition: {
    bg: 'bg-violet-50 dark:bg-violet-900/20',
    border: 'border-violet-400 dark:border-violet-500',
    text: 'text-violet-700 dark:text-violet-300',
  },
  xref: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-400 dark:border-amber-500',
    text: 'text-amber-700 dark:text-amber-300',
  },
};

// Edge weight to stroke width mapping
const EDGE_WEIGHT_STYLES: Record<number, { strokeWidth: number; opacity: number }> = {
  1: { strokeWidth: 1, opacity: 0.4 },
  2: { strokeWidth: 2, opacity: 0.5 },
  3: { strokeWidth: 3, opacity: 0.6 },
  4: { strokeWidth: 4, opacity: 0.7 },
  5: { strokeWidth: 5, opacity: 0.8 },
};

// Stable layout algorithm - creates consistent positions based on node IDs
const generateStableLayout = (nodes: GraphNode[], _edges: GraphEdge[]): Record<string, { x: number; y: number }> => {
  const positions: Record<string, { x: number; y: number }> = {};
  
  // Group nodes by type for better organization
  const nodesByType: Record<NodeType, GraphNode[]> = {
    definition: [],
    financial: [],
    covenant: [],
    xref: [],
  };
  
  nodes.forEach(node => {
    nodesByType[node.type].push(node);
  });
  
  // Layout parameters
  const TYPE_SPACING = 300;
  const NODE_SPACING = 150;
  
  let currentY = 100;
  
  // Position nodes by type in columns
  Object.entries(nodesByType).forEach(([type, typeNodes], typeIndex) => {
    if (typeNodes.length === 0) return;
    
    const x = 100 + (typeIndex * TYPE_SPACING);
    let y = currentY;
    
    typeNodes.forEach((node, nodeIndex) => {
      // Use node ID hash for consistent positioning within type
      const hash = node.id.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      
      const offsetY = (Math.abs(hash) % 100) - 50; // -50 to +50 offset
      
      positions[node.id] = {
        x: x + ((nodeIndex % 2) * 100), // Alternate slightly for readability
        y: y + offsetY,
      };
      
      y += NODE_SPACING;
    });
  });
  
  return positions;
};

const GraphCanvas: React.FC<GraphCanvasProps> = ({
  nodes: graphNodes,
  edges: graphEdges,
  selectedNodeId,
  highlightedNodeIds = new Set(),
  onNodeSelect,
  onNodeDoubleClick,
  className = '',
}) => {
  const layoutRef = useRef<Record<string, { x: number; y: number }> | null>(null);
  const { fitView } = useReactFlow();
  
  // Generate stable layout only once or when nodes change significantly
  const stableLayout = useMemo(() => {
    if (!layoutRef.current || Object.keys(layoutRef.current).length !== graphNodes.length) {
      layoutRef.current = generateStableLayout(graphNodes, graphEdges);
    }
    return layoutRef.current;
  }, [graphEdges, graphNodes]);
  
  // Convert graph nodes to React Flow nodes with stable positions
  const reactFlowNodes = useMemo(() => {
    return graphNodes.map((node): Node => {
      const colors = NODE_TYPE_COLORS[node.type];
      const isSelected = selectedNodeId === node.id;
      const isHighlighted = highlightedNodeIds.has(node.id);
      const isDimmed = highlightedNodeIds.size > 0 && !isHighlighted && !isSelected;
      const position = stableLayout[node.id] || { x: 0, y: 0 };
      
      return {
        id: node.id,
        type: 'custom',
        position,
        data: {
          ...node,
          colors,
          isSelected,
          isHighlighted,
          isDimmed,
        },
        selected: isSelected,
        draggable: true,
        selectable: true,
      };
    });
  }, [graphNodes, selectedNodeId, highlightedNodeIds, stableLayout]);

  // Convert graph edges to React Flow edges
  const reactFlowEdges = useMemo(() => {
    return graphEdges.map((edge): Edge => {
      const style = EDGE_WEIGHT_STYLES[edge.weight] || EDGE_WEIGHT_STYLES[3];
      const isHighlighted = highlightedNodeIds.has(edge.sourceId) && highlightedNodeIds.has(edge.targetId);
      const isDimmed = highlightedNodeIds.size > 0 && !isHighlighted;
      
      return {
        id: edge.id,
        source: edge.sourceId,
        target: edge.targetId,
        type: 'smoothstep',
        animated: isHighlighted,
        style: {
          strokeWidth: isHighlighted ? style.strokeWidth + 1 : style.strokeWidth,
          opacity: isDimmed ? 0.15 : style.opacity,
          stroke: isHighlighted ? '#6366f1' : '#94a3b8',
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: isHighlighted ? '#6366f1' : '#94a3b8',
        },
        data: {
          weight: edge.weight,
        },
      };
    });
  }, [graphEdges, highlightedNodeIds]);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Update nodes when props change, but preserve user-moved positions
  useEffect(() => {
    setNodes((currentNodes) => {
      const nodeMap = new Map(currentNodes.map(n => [n.id, n]));
      
      return reactFlowNodes.map(newNode => {
        const existingNode = nodeMap.get(newNode.id);
        if (existingNode && existingNode.position) {
          // Preserve user-moved positions
          return {
            ...newNode,
            position: existingNode.position,
          };
        }
        return newNode;
      });
    });
  }, [reactFlowNodes, setNodes]);

  // Update edges when props change
  useEffect(() => {
    setEdges(reactFlowEdges);
  }, [reactFlowEdges, setEdges]);

  // Handle node selection
  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.stopPropagation();
      onNodeSelect?.(node.id);
    },
    [onNodeSelect]
  );

  // Handle node double click
  const onNodeDoubleClickHandler = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.stopPropagation();
      onNodeDoubleClick?.(node.id);
    },
    [onNodeDoubleClick]
  );

  // Handle pane click (deselect)
  const onPaneClick = useCallback(() => {
    onNodeSelect?.(null);
  }, [onNodeSelect]);

  // Custom node types
  const nodeTypes: NodeTypes = useMemo(
    () => ({
      custom: CustomNode,
    }),
    []
  );

  // Fit view on initial load
  useEffect(() => {
    if (nodes.length > 0) {
      const timer = setTimeout(() => {
        fitView({ padding: 0.1, duration: 800 });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [nodes.length, fitView]);

  return (
    <div className={`w-full h-full ${className}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClickHandler}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView={false} // We handle this manually
        minZoom={0.2}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        className="bg-slate-50 dark:bg-slate-950"
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        selectNodesOnDrag={false}
        panOnDrag={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        preventScrolling={false}
      >
        <Controls
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden"
          showZoom={true}
          showFitView={true}
          showInteractive={false}
        />
        <Background
          color="#cbd5e1"
          gap={24}
          size={1}
          className="dark:opacity-10"
        />
      </ReactFlow>
    </div>
  );
};

export default GraphCanvas;