/**
 * Drift Service
 * Handles commercial drift detection, baseline override, and draft revert
 * Requirements: 7.1, 7.2, 7.4, 7.5, 7.7
 */

import { DriftItem, DriftSeverity, DriftStatus } from '../types/drift';
import { ClauseType } from '../types/document';
import { ReasonCategory } from '../types/audit';
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
 * List drift filter
 */
export interface ListDriftFilter {
  workspaceId: string;
  severity?: DriftSeverity;
  type?: ClauseType;
  status?: DriftStatus;
  keyword?: string;
}

/**
 * Override baseline input
 */
export interface OverrideBaselineInput {
  driftId: string;
  reason: string;
  reasonCategory?: ReasonCategory;
}

/**
 * Override baseline result
 */
export interface OverrideBaselineResult {
  success: boolean;
  drift?: DriftItem;
  error?: ServiceError;
}

/**
 * Revert draft input
 */
export interface RevertDraftInput {
  driftId: string;
  reason: string;
  reasonCategory?: ReasonCategory;
}

/**
 * Revert draft result
 */
export interface RevertDraftResult {
  success: boolean;
  drift?: DriftItem;
  error?: ServiceError;
}

/**
 * Recompute drift result
 */
export interface RecomputeDriftResult {
  success: boolean;
  driftCount?: number;
  error?: ServiceError;
}

/**
 * List drift items with optional filtering
 * Requirements: 7.1, 7.5
 */
export async function listDrift(filter: ListDriftFilter): Promise<DriftItem[]> {
  if (!filter.workspaceId) {
    return [];
  }

  try {
    const params = new URLSearchParams();
    params.append('workspaceId', filter.workspaceId);
    if (filter.severity) params.append('severity', filter.severity);
    if (filter.type) params.append('type', filter.type);
    if (filter.status) params.append('status', filter.status);
    if (filter.keyword) params.append('keyword', filter.keyword);

    const response = await apiRequest<{ driftItems: DriftItem[] }>(
      `/drifts?${params.toString()}`
    );
    
    return response.driftItems;
  } catch (error: any) {
    console.error('Error listing drift items:', error);
    return [];
  }
}

/**
 * Get a single drift item by ID
 */
export async function getDrift(driftId: string): Promise<DriftItem | null> {
  if (!driftId) {
    return null;
  }

  try {
    const response = await apiRequest<{ drift: DriftItem }>(`/drifts/${driftId}`);
    return response.drift;
  } catch (error: any) {
    console.error('Error getting drift item:', error);
    return null;
  }
}

/**
 * Override baseline - sets baselineValue = currentValue
 * Logs DRIFT_OVERRIDE audit event
 * Requirements: 7.2
 */
export async function overrideBaseline(
  input: OverrideBaselineInput,
  actorId: string,
  actorName: string
): Promise<OverrideBaselineResult> {
  // Validate inputs
  if (!input.driftId) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Drift ID is required',
      },
    };
  }

  if (!input.reason || !input.reason.trim()) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Reason is required for baseline override',
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
    const response = await apiRequest<{ success: boolean; drift: DriftItem }>(
      `/drifts/${input.driftId}/override`,
      {
        method: 'POST',
        body: JSON.stringify({
          reason: input.reason,
          reasonCategory: input.reasonCategory,
        }),
      }
    );

    return {
      success: true,
      drift: response.drift,
    };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: 'REQUEST_FAILED',
        message: error.message || 'Failed to override baseline',
      },
    };
  }
}


/**
 * Revert draft - sets currentValue = baselineValue
 * Updates clause text and logs DRIFT_REVERT audit event
 * Requirements: 7.4
 */
export async function revertDraft(
  input: RevertDraftInput,
  actorId: string,
  actorName: string
): Promise<RevertDraftResult> {
  // Validate inputs
  if (!input.driftId) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Drift ID is required',
      },
    };
  }

  if (!input.reason || !input.reason.trim()) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Reason is required for draft revert',
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
    const response = await apiRequest<{ success: boolean; drift: DriftItem }>(
      `/drifts/${input.driftId}/revert`,
      {
        method: 'POST',
        body: JSON.stringify({
          reason: input.reason,
          reasonCategory: input.reasonCategory,
        }),
      }
    );

    return {
      success: true,
      drift: response.drift,
    };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: 'REQUEST_FAILED',
        message: error.message || 'Failed to revert draft',
      },
    };
  }
}

/**
 * Recompute drift items based on current variable values vs baselines
 * Requirements: 5.3, 7.1
 */
export async function recomputeDrift(
  workspaceId: string
): Promise<RecomputeDriftResult> {
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
    const response = await apiRequest<{ success: boolean; driftCount: number }>(
      `/drifts/recompute`,
      {
        method: 'POST',
        body: JSON.stringify({ workspaceId }),
      }
    );

    return {
      success: true,
      driftCount: response.driftCount,
    };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: 'REQUEST_FAILED',
        message: error.message || 'Failed to recompute drift',
      },
    };
  }
}

/**
 * Get count of unresolved HIGH severity drift for a workspace
 * Used for Golden Record publish gating
 * Requirements: 7.7
 */
export async function getUnresolvedHighDriftCount(
  workspaceId: string
): Promise<number> {
  if (!workspaceId) {
    return 0;
  }

  try {
    const response = await apiRequest<{ count: number }>(
      `/drifts/high-drift-count?workspaceId=${encodeURIComponent(workspaceId)}`
    );
    return response.count;
  } catch (error: any) {
    console.error('Error getting high drift count:', error);
    return 0;
  }
}

/**
 * Check if publishing is blocked due to HIGH drift
 * Requirements: 7.7
 */
export async function isPublishBlocked(workspaceId: string): Promise<boolean> {
  if (!workspaceId) {
    return false;
  }

  try {
    const response = await apiRequest<{ blocked: boolean }>(
      `/drifts/publish-blocked?workspaceId=${encodeURIComponent(workspaceId)}`
    );
    return response.blocked;
  } catch (error: any) {
    console.error('Error checking publish blocked:', error);
    // Default to blocked on error for safety
    return true;
  }
}

/**
 * Approve a drift item (Risk/Credit role)
 * Requirements: 7.3, 7.8
 */
export async function approveDrift(
  driftId: string,
  reason: string,
  actorId: string,
  actorName: string
): Promise<{ success: boolean; drift?: DriftItem; error?: ServiceError }> {
  if (!driftId) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Drift ID is required',
      },
    };
  }

  if (!reason || !reason.trim()) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Reason is required for drift approval',
      },
    };
  }

  try {
    const response = await apiRequest<{ success: boolean; drift: DriftItem }>(
      `/drifts/${driftId}/approve`,
      {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }
    );

    return {
      success: true,
      drift: response.drift,
    };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: 'REQUEST_FAILED',
        message: error.message || 'Failed to approve drift',
      },
    };
  }
}
