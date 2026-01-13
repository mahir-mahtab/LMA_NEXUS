/**
 * Graph Service
 * Handles graph visualization, recomputation, and node navigation
 * Requirements: 5.1, 5.2, 5.4, 6.3
 */

import { GraphNode, GraphState } from '../types/graph';
import { getAccessToken } from './authService';

// API Base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';

/**
 * Make authenticated API request
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const accessToken = getAccessToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Request failed' } }));
    throw new Error(error.error?.message || 'Request failed');
  }

  return response.json();
}

/**
 * Service error type
 */
export interface ServiceError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Get graph result
 */
export interface GetGraphResult {
  success: boolean;
  graph?: GraphState;
  error?: ServiceError;
}

/**
 * Recompute graph result
 */
export interface RecomputeGraphResult {
  success: boolean;
  integrityScore?: number;
  nodeCount?: number;
  edgeCount?: number;
  error?: ServiceError;
}

/**
 * Locate node result
 */
export interface LocateNodeResult {
  success: boolean;
  clauseId?: string;
  variableId?: string;
  error?: ServiceError;
}

/**
 * Get the current graph state for a workspace
 * Requirements: 5.4
 */
export async function getGraph(workspaceId: string): Promise<GetGraphResult> {
  if (!workspaceId) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Workspace ID is required',
      },
    };
  }

  try {
    const response = await apiRequest<{ graph: GraphState }>(`/graph/${workspaceId}`);
    
    return {
      success: true,
      graph: response.graph,
    };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: 'REQUEST_FAILED',
        message: error.message || 'Failed to get graph',
      },
    };
  }
}


/**
 * Recompute the graph from current clauses and variables
 * Rebuilds all nodes and edges based on current state
 * Requirements: 5.1, 5.2
 */
export async function recomputeGraph(
  workspaceId: string,
  actorId: string,
  actorName: string
): Promise<RecomputeGraphResult> {
  if (!workspaceId) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Workspace ID is required',
      },
    };
  }

  if (!actorId || !actorName) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Actor information is required',
      },
    };
  }

  try {
    const response = await apiRequest<{
      success: boolean;
      integrityScore: number;
      nodeCount: number;
      edgeCount: number;
    }>(`/graph/${workspaceId}/recompute`, {
      method: 'POST',
    });

    return {
      success: true,
      integrityScore: response.integrityScore,
      nodeCount: response.nodeCount,
      edgeCount: response.edgeCount,
    };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: 'REQUEST_FAILED',
        message: error.message || 'Failed to recompute graph',
      },
    };
  }
}

/**
 * Locate a node and return its clause ID for navigation
 * Requirements: 6.3
 */
export async function locateNode(nodeId: string): Promise<LocateNodeResult> {
  if (!nodeId) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Node ID is required',
      },
    };
  }

  try {
    const response = await apiRequest<{
      success: boolean;
      clauseId?: string;
      variableId?: string;
    }>(`/graph/nodes/${nodeId}/locate`);

    return {
      success: true,
      clauseId: response.clauseId,
      variableId: response.variableId,
    };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: 'REQUEST_FAILED',
        message: error.message || 'Failed to locate node',
      },
    };
  }
}

/**
 * Get a single node by ID
 */
export async function getNode(nodeId: string): Promise<GraphNode | null> {
  if (!nodeId) {
    return null;
  }

  try {
    const response = await apiRequest<{ node: GraphNode }>(`/graph/nodes/${nodeId}`);
    return response.node;
  } catch (error: any) {
    console.error('Error getting node:', error);
    return null;
  }
}

/**
 * Get all nodes connected to a given node
 */
export async function getConnectedNodes(nodeId: string): Promise<GraphNode[]> {
  if (!nodeId) {
    return [];
  }

  try {
    const response = await apiRequest<{ nodes: GraphNode[] }>(`/graph/nodes/${nodeId}/connected`);
    return response.nodes;
  } catch (error: any) {
    console.error('Error getting connected nodes:', error);
    return [];
  }
}
