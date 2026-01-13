/**
 * Reconciliation Service
 * Handles AI-powered reconciliation of external markups
 * Connects to backend API for real AI processing
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

import {
  ReconciliationItem,
  ReconciliationSession,
  ConfidenceLevel,
} from '../types/reconciliation';
import { ReasonCategory } from '../types/audit';

// API Base URL - configure for your environment
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';

/**
 * Service error type
 */
export interface ServiceError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Upload dirty draft input
 */
export interface UploadDirtyDraftInput {
  workspaceId: string;
  file: File;
}

/**
 * Upload dirty draft result
 */
export interface UploadDirtyDraftResult {
  success: boolean;
  session?: ReconciliationSession;
  items?: ReconciliationItem[];
  error?: ServiceError;
}

/**
 * Apply suggestion input
 */
export interface ApplySuggestionInput {
  itemId: string;
  reason?: string;
  reasonCategory?: ReasonCategory;
}

/**
 * Apply suggestion result
 */
export interface ApplySuggestionResult {
  success: boolean;
  item?: ReconciliationItem;
  driftCreated?: boolean;
  error?: ServiceError;
}

/**
 * Reject suggestion input
 */
export interface RejectSuggestionInput {
  itemId: string;
  reason?: string;
  reasonCategory?: ReasonCategory;
}

/**
 * Reject suggestion result
 */
export interface RejectSuggestionResult {
  success: boolean;
  item?: ReconciliationItem;
  error?: ServiceError;
}

/**
 * List items filter
 */
export interface ListItemsFilter {
  decision?: 'pending' | 'applied' | 'rejected';
  confidence?: ConfidenceLevel;
}

// Forward declarations for service dependencies (for local triggers after apply)
let graphServiceRecomputeGraph: ((workspaceId: string, actorId: string, actorName: string) => Promise<{ success: boolean }>) | null = null;
let driftServiceRecomputeDrift: ((workspaceId: string) => Promise<{ success: boolean }>) | null = null;

/**
 * Set the graph service recompute function (for dependency injection)
 */
export function setGraphServiceRecompute(
  fn: (workspaceId: string, actorId: string, actorName: string) => Promise<{ success: boolean }>
): void {
  graphServiceRecomputeGraph = fn;
}

/**
 * Set the drift service recompute function (for dependency injection)
 */
export function setDriftServiceRecompute(
  fn: (workspaceId: string) => Promise<{ success: boolean }>
): void {
  driftServiceRecomputeDrift = fn;
}

/**
 * Get access token from storage
 */
function getAccessToken(): string | null {
  return localStorage.getItem('lma_access_token');
}

/**
 * Make authenticated API request
 */
async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAccessToken();
  
  const headers: Record<string, string> = {
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  // Don't set Content-Type for FormData (browser will set it with boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers as Record<string, string>),
    },
  });

  return response;
}

/**
 * Upload an external document for AI reconciliation
 * Parses content and generates reconciliation suggestions using AI
 * Requirements: 8.1, 8.2
 */
export async function uploadDirtyDraft(
  input: UploadDirtyDraftInput,
  actorId: string,
  actorName: string
): Promise<UploadDirtyDraftResult> {
  try {
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

    if (!input.file) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'File is required',
        },
      };
    }

    // Check file type
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const validExtensions = ['.pdf', '.docx'];
    const ext = input.file.name.toLowerCase().slice(input.file.name.lastIndexOf('.'));
    
    if (!validTypes.includes(input.file.type) && !validExtensions.includes(ext)) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid file type. Only PDF and DOCX are supported.',
        },
      };
    }

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('document', input.file);
    formData.append('workspaceId', input.workspaceId);

    const response = await fetchWithAuth(`${API_BASE_URL}/reconciliations/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.error || {
          code: 'API_ERROR',
          message: 'Failed to upload document for reconciliation',
        },
      };
    }

    return {
      success: true,
      session: data.session,
      items: data.items,
    };
  } catch (error: any) {
    console.error('Error uploading dirty draft:', error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error.message || 'Failed to connect to server',
      },
    };
  }
}

/**
 * List reconciliation items for a workspace or session
 * Requirements: 8.2
 */
export async function listReconciliationItems(
  workspaceId: string,
  sessionId?: string,
  filter?: ListItemsFilter
): Promise<ReconciliationItem[]> {
  try {
    if (!workspaceId) {
      return [];
    }

    // If sessionId is provided, use the session items endpoint
    let url: string;
    if (sessionId) {
      url = `${API_BASE_URL}/reconciliations/sessions/${sessionId}/items`;
      const params = new URLSearchParams();
      if (filter?.decision) params.append('decision', filter.decision);
      if (filter?.confidence) params.append('confidence', filter.confidence);
      if (params.toString()) url += `?${params.toString()}`;
    } else {
      // Get all items for workspace (first get sessions, then items)
      const sessions = await listSessions(workspaceId);
      const allItems: ReconciliationItem[] = [];
      for (const session of sessions) {
        const items = await listReconciliationItems(workspaceId, session.id, filter);
        allItems.push(...items);
      }
      return allItems;
    }

    const response = await fetchWithAuth(url);
    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error('Error listing reconciliation items:', data.error);
      return [];
    }

    return data.items || [];
  } catch (error: any) {
    console.error('Error listing reconciliation items:', error);
    return [];
  }
}

/**
 * Get a reconciliation session by ID
 */
export async function getSession(
  sessionId: string
): Promise<ReconciliationSession | null> {
  try {
    if (!sessionId) {
      return null;
    }

    // Note: We don't have a direct get session endpoint
    // The session data should be fetched along with items or via list
    return null;
  } catch (error: any) {
    console.error('Error getting session:', error);
    return null;
  }
}

/**
 * Get all sessions for a workspace
 */
export async function listSessions(
  workspaceId: string
): Promise<ReconciliationSession[]> {
  try {
    if (!workspaceId) {
      return [];
    }

    const response = await fetchWithAuth(
      `${API_BASE_URL}/reconciliations/sessions?workspaceId=${encodeURIComponent(workspaceId)}`
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error('Error listing sessions:', data.error);
      return [];
    }

    return data.sessions || [];
  } catch (error: any) {
    console.error('Error listing sessions:', error);
    return [];
  }
}


/**
 * Apply a reconciliation suggestion
 * Updates clause text and variables, triggers drift creation if needed
 * Logs RECON_APPLY audit event
 * Requirements: 8.3
 */
export async function applySuggestion(
  input: ApplySuggestionInput,
  actorId: string,
  actorName: string
): Promise<ApplySuggestionResult> {
  try {
    // Validate inputs
    if (!input.itemId) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Item ID is required',
        },
      };
    }

    const response = await fetchWithAuth(
      `${API_BASE_URL}/reconciliations/items/${input.itemId}/apply`,
      {
        method: 'POST',
        body: JSON.stringify({
          reason: input.reason,
          reasonCategory: input.reasonCategory,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.error || {
          code: 'API_ERROR',
          message: 'Failed to apply suggestion',
        },
      };
    }

    // Trigger local graph/drift recompute if handlers are set
    // Note: Backend already creates drift, but frontend may want to refresh local state
    if (data.item?.workspaceId) {
      if (graphServiceRecomputeGraph) {
        await graphServiceRecomputeGraph(data.item.workspaceId, actorId, actorName);
      }
      if (driftServiceRecomputeDrift) {
        await driftServiceRecomputeDrift(data.item.workspaceId);
      }
    }

    return {
      success: true,
      item: data.item,
      driftCreated: data.driftCreated,
    };
  } catch (error: any) {
    console.error('Error applying suggestion:', error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error.message || 'Failed to connect to server',
      },
    };
  }
}

/**
 * Reject a reconciliation suggestion
 * Logs RECON_REJECT audit event
 * Requirements: 8.4
 */
export async function rejectSuggestion(
  input: RejectSuggestionInput,
  actorId: string,
  actorName: string
): Promise<RejectSuggestionResult> {
  try {
    // Validate inputs
    if (!input.itemId) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Item ID is required',
        },
      };
    }

    const response = await fetchWithAuth(
      `${API_BASE_URL}/reconciliations/items/${input.itemId}/reject`,
      {
        method: 'POST',
        body: JSON.stringify({
          reason: input.reason,
          reasonCategory: input.reasonCategory,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.error || {
          code: 'API_ERROR',
          message: 'Failed to reject suggestion',
        },
      };
    }

    return {
      success: true,
      item: data.item,
    };
  } catch (error: any) {
    console.error('Error rejecting suggestion:', error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error.message || 'Failed to connect to server',
      },
    };
  }
}

/**
 * Get a single reconciliation item by ID
 */
export async function getItem(itemId: string): Promise<ReconciliationItem | null> {
  try {
    if (!itemId) {
      return null;
    }

    const response = await fetchWithAuth(
      `${API_BASE_URL}/reconciliations/items/${itemId}`
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error('Error getting item:', data.error);
      return null;
    }

    return data.item || null;
  } catch (error: any) {
    console.error('Error getting item:', error);
    return null;
  }
}

/**
 * Get reconciliation statistics for a workspace
 */
export async function getReconciliationStats(workspaceId: string): Promise<{
  totalSessions: number;
  totalItems: number;
  pendingItems: number;
  appliedItems: number;
  rejectedItems: number;
}> {
  try {
    const sessions = await listSessions(workspaceId);
    
    let totalItems = 0;
    let pendingItems = 0;
    let appliedItems = 0;
    let rejectedItems = 0;

    for (const session of sessions) {
      totalItems += session.totalItems;
      pendingItems += session.pendingCount;
      appliedItems += session.appliedCount;
      rejectedItems += session.rejectedCount;
    }

    return {
      totalSessions: sessions.length,
      totalItems,
      pendingItems,
      appliedItems,
      rejectedItems,
    };
  } catch (error) {
    console.error('Error getting reconciliation stats:', error);
    return {
      totalSessions: 0,
      totalItems: 0,
      pendingItems: 0,
      appliedItems: 0,
      rejectedItems: 0,
    };
  }
}
