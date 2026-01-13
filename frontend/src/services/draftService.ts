/**
 * Draft Service
 * Handles clause drafting, variable binding, and graph synchronization
 * Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.3
 * 
 * INTEGRATED WITH BACKEND API
 */

import { Clause, Variable, VariableType } from '../types/document';
import { ReasonCategory } from '../types/audit';
import { getAccessToken } from './authService';

// API base URL - configurable via environment variable
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
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `HTTP ${response.status}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
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
 * Document outline item (simplified clause for list display)
 */
export interface OutlineItem {
  id: string;
  title: string;
  type: Clause['type'];
  order: number;
  isSensitive: boolean;
  isLocked: boolean;
}

/**
 * Update clause text input
 */
export interface UpdateClauseTextInput {
  clauseId: string;
  newBody: string;
  reason?: string;
  reasonCategory?: ReasonCategory;
}

/**
 * Update clause text result
 */
export interface UpdateClauseTextResult {
  success: boolean;
  clause?: Clause;
  error?: ServiceError;
}

/**
 * Bind variable input
 */
export interface BindVariableInput {
  workspaceId: string;
  clauseId: string;
  label: string;
  type: VariableType;
  value: string;
  unit?: string;
  baselineValue?: string;
}

/**
 * Bind variable result
 */
export interface BindVariableResult {
  success: boolean;
  variable?: Variable;
  error?: ServiceError;
}

/**
 * Sync to graph result
 */
export interface SyncToGraphResult {
  success: boolean;
  integrityScore?: number;
  nodeCount?: number;
  edgeCount?: number;
  driftCount?: number;
  error?: ServiceError;
}

/**
 * Get document outline for a workspace
 * Returns simplified clause list for navigation
 * Requirements: 4.1
 */
export async function getDocumentOutline(workspaceId: string): Promise<OutlineItem[]> {
  if (!workspaceId) {
    return [];
  }

  try {
    const response = await apiRequest<{ outline: OutlineItem[] }>(
      `/workspaces/${workspaceId}/outline`
    );
    return response.outline;
  } catch (error) {
    console.error('Error fetching document outline:', error);
    return [];
  }
}

/**
 * Get a single clause by ID
 * Requirements: 4.1
 */
export async function getClause(clauseId: string): Promise<Clause | null> {
  if (!clauseId) {
    return null;
  }

  try {
    const response = await apiRequest<{ clause: Clause }>(
      `/drafts/clauses/${clauseId}`
    );
    return response.clause;
  } catch (error) {
    console.error('Error fetching clause:', error);
    return null;
  }
}

/**
 * Get all variables bound to a clause
 * Requirements: 4.1
 */
export async function getVariablesForClause(clauseId: string): Promise<Variable[]> {
  if (!clauseId) {
    return [];
  }

  try {
    const response = await apiRequest<{ variables: Variable[] }>(
      `/drafts/clauses/${clauseId}/variables`
    );
    return response.variables;
  } catch (error) {
    console.error('Error fetching variables for clause:', error);
    return [];
  }
}

/**
 * Update clause text
 * Updates lastModifiedAt timestamp
 * Sensitive clause edits require reason parameter
 * Requirements: 4.2, 4.3
 */
export async function updateClauseText(
  input: UpdateClauseTextInput,
  actorId: string,
  actorName: string
): Promise<UpdateClauseTextResult> {
  // Validate inputs
  if (!input.clauseId) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Clause ID is required',
      },
    };
  }

  if (input.newBody === undefined || input.newBody === null) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'New body is required',
      },
    };
  }

  if (!actorId) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Actor ID is required',
      },
    };
  }

  if (!actorName) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Actor name is required',
      },
    };
  }

  try {
    const response = await apiRequest<{ clause: Clause }>(
      `/drafts/clauses/${input.clauseId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          newBody: input.newBody,
          reason: input.reason,
          reasonCategory: input.reasonCategory,
        }),
      }
    );
    return {
      success: true,
      clause: response.clause,
    };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: 'API_ERROR',
        message: error.message || 'Failed to update clause',
      },
    };
  }
}

/**
 * Bind a variable to a clause
 * Captures variable label, type, value, and unit
 * Logs VARIABLE_BIND audit event
 * Requirements: 4.4
 */
export async function bindVariable(
  input: BindVariableInput,
  actorId: string,
  actorName: string
): Promise<BindVariableResult> {
  // Validate inputs
  if (!input.workspaceId) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Workspace ID is required',
      },
    };
  }

  if (!input.clauseId) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Clause ID is required',
      },
    };
  }

  if (!input.label || !input.label.trim()) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Variable label is required',
      },
    };
  }

  if (!input.type) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Variable type is required',
      },
    };
  }

  if (input.value === undefined || input.value === null) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Variable value is required',
      },
    };
  }

  if (!actorId) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Actor ID is required',
      },
    };
  }

  if (!actorName) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Actor name is required',
      },
    };
  }

  try {
    const response = await apiRequest<{ variable: Variable }>(
      `/workspaces/${input.workspaceId}/variables`,
      {
        method: 'POST',
        body: JSON.stringify({
          clauseId: input.clauseId,
          label: input.label.trim(),
          type: input.type,
          value: input.value,
          unit: input.unit,
          baselineValue: input.baselineValue,
        }),
      }
    );
    return {
      success: true,
      variable: response.variable,
    };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: 'API_ERROR',
        message: error.message || 'Failed to bind variable',
      },
    };
  }
}

/**
 * Update an existing variable
 * Logs VARIABLE_EDIT audit event
 * Requirements: 4.4
 */
export async function updateVariable(
  variableId: string,
  updates: Partial<Pick<Variable, 'label' | 'type' | 'value' | 'unit'>>,
  actorId: string,
  actorName: string
): Promise<{ success: boolean; variable?: Variable; error?: ServiceError }> {
  if (!variableId) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Variable ID is required',
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
    const response = await apiRequest<{ variable: Variable }>(
      `/drafts/variables/${variableId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }
    );
    return {
      success: true,
      variable: response.variable,
    };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: 'API_ERROR',
        message: error.message || 'Failed to update variable',
      },
    };
  }
}

/**
 * Sync document to graph
 * Triggers graphService.recomputeGraph and driftService.recomputeDrift
 * Requirements: 5.1, 5.3
 */
export async function syncToGraph(
  workspaceId: string,
  actorId: string,
  actorName: string
): Promise<SyncToGraphResult> {
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
      integrityScore: number;
      nodeCount: number;
      edgeCount: number;
      driftCount: number;
    }>(`/workspaces/${workspaceId}/sync`, {
      method: 'POST',
    });

    return {
      success: true,
      integrityScore: response.integrityScore,
      nodeCount: response.nodeCount,
      edgeCount: response.edgeCount,
      driftCount: response.driftCount,
    };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: 'API_ERROR',
        message: error.message || 'Failed to sync to graph',
      },
    };
  }
}

/**
 * Get all clauses for a workspace
 */
export async function getClausesForWorkspace(workspaceId: string): Promise<Clause[]> {
  if (!workspaceId) {
    return [];
  }

  try {
    const response = await apiRequest<{ clauses: Clause[] }>(
      `/workspaces/${workspaceId}/clauses`
    );
    return response.clauses;
  } catch (error) {
    console.error('Error fetching clauses for workspace:', error);
    return [];
  }
}

/**
 * Get all variables for a workspace
 */
export async function getVariablesForWorkspace(workspaceId: string): Promise<Variable[]> {
  if (!workspaceId) {
    return [];
  }

  try {
    const response = await apiRequest<{ variables: Variable[] }>(
      `/workspaces/${workspaceId}/variables`
    );
    return response.variables;
  } catch (error) {
    console.error('Error fetching variables for workspace:', error);
    return [];
  }
}

/**
 * Lock a clause (prevent edits)
 */
export async function lockClause(
  clauseId: string,
  actorId: string,
  actorName: string
): Promise<{ success: boolean; clause?: Clause; error?: ServiceError }> {
  if (!clauseId) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Clause ID is required',
      },
    };
  }

  try {
    const response = await apiRequest<{ clause: Clause }>(
      `/drafts/clauses/${clauseId}/lock`,
      { method: 'POST' }
    );
    return {
      success: true,
      clause: response.clause,
    };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: 'API_ERROR',
        message: error.message || 'Failed to lock clause',
      },
    };
  }
}

/**
 * Unlock a clause (allow edits)
 */
export async function unlockClause(
  clauseId: string,
  actorId: string,
  actorName: string
): Promise<{ success: boolean; clause?: Clause; error?: ServiceError }> {
  if (!clauseId) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Clause ID is required',
      },
    };
  }

  try {
    const response = await apiRequest<{ clause: Clause }>(
      `/drafts/clauses/${clauseId}/lock`,
      { method: 'DELETE' }
    );
    return {
      success: true,
      clause: response.clause,
    };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: 'API_ERROR',
        message: error.message || 'Failed to unlock clause',
      },
    };
  }
}

/**
 * Delete a variable
 */
export async function deleteVariable(
  variableId: string,
  actorId: string,
  actorName: string
): Promise<{ success: boolean; error?: ServiceError }> {
  if (!variableId) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Variable ID is required',
      },
    };
  }

  try {
    await apiRequest(`/drafts/variables/${variableId}`, {
      method: 'DELETE',
    });
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: 'API_ERROR',
        message: error.message || 'Failed to delete variable',
      },
    };
  }
}
