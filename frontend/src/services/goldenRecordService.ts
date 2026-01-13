/**
 * Golden Record Service
 * Handles golden record export and publish operations
 * Requirements: 9.1, 9.2, 9.3, 9.4
 */

import { GoldenRecord, DownstreamConnector, Covenant } from '../types/golden-record';
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
 * Get golden record result
 */
export interface GetGoldenRecordResult {
  success: boolean;
  goldenRecord?: GoldenRecord;
  error?: ServiceError;
}

/**
 * Export schema result
 */
export interface ExportSchemaResult {
  success: boolean;
  schemaJson?: string;
  filename?: string;
  error?: ServiceError;
}

/**
 * Publish result
 */
export interface PublishResult {
  success: boolean;
  goldenRecord?: GoldenRecord;
  error?: ServiceError;
}

/**
 * Get the golden record for a workspace
 * Computes status from integrityScore and unresolvedHighDriftCount
 * Requirements: 9.1
 */
export async function getGoldenRecord(
  workspaceId: string
): Promise<GetGoldenRecordResult> {
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
    const response = await apiRequest<{ goldenRecord: GoldenRecord }>(
      `/golden-records/${workspaceId}`
    );

    return {
      success: true,
      goldenRecord: response.goldenRecord,
    };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: 'REQUEST_FAILED',
        message: error.message || 'Failed to get golden record',
      },
    };
  }
}

/**
 * Export the golden record schema as JSON
 * Logs EXPORT_JSON audit event
 * Requirements: 9.2
 */
export async function exportSchema(
  workspaceId: string,
  actorId: string,
  actorName: string
): Promise<ExportSchemaResult> {
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
      schemaJson: string;
      filename: string;
    }>(`/golden-records/${workspaceId}/export`, {
      method: 'POST',
    });

    return {
      success: true,
      schemaJson: response.schemaJson,
      filename: response.filename,
    };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: 'REQUEST_FAILED',
        message: error.message || 'Failed to export schema',
      },
    };
  }
}


/**
 * Publish the golden record to downstream systems
 * Blocked if status is IN_REVIEW
 * Logs PUBLISH audit event
 * Requirements: 9.3, 9.4
 */
export async function publish(
  workspaceId: string,
  reason: string,
  actorId: string,
  actorName: string,
  reasonCategory?: ReasonCategory
): Promise<PublishResult> {
  // Validate inputs
  if (!workspaceId) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Workspace ID is required',
      },
    };
  }

  if (!reason || !reason.trim()) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Reason is required for publishing',
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
      goldenRecord: GoldenRecord;
    }>(`/golden-records/${workspaceId}/publish`, {
      method: 'POST',
      body: JSON.stringify({
        reason,
        reasonCategory,
      }),
    });

    return {
      success: true,
      goldenRecord: response.goldenRecord,
    };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: 'REQUEST_FAILED',
        message: error.message || 'Failed to publish golden record',
      },
    };
  }
}

/**
 * Get covenants for a workspace
 * Requirements: 9.5
 */
export async function getCovenants(workspaceId: string): Promise<Covenant[]> {
  if (!workspaceId) {
    return [];
  }

  try {
    const response = await apiRequest<{ covenants: Covenant[] }>(
      `/golden-records/${workspaceId}/covenants`
    );
    return response.covenants;
  } catch (error: any) {
    console.error('Error getting covenants:', error);
    return [];
  }
}

/**
 * Get downstream connectors for a workspace
 * Requirements: 9.6
 */
export async function getConnectors(
  workspaceId: string
): Promise<DownstreamConnector[]> {
  if (!workspaceId) {
    return [];
  }

  try {
    const response = await apiRequest<{ connectors: DownstreamConnector[] }>(
      `/golden-records/${workspaceId}/connectors`
    );
    return response.connectors;
  } catch (error: any) {
    console.error('Error getting connectors:', error);
    return [];
  }
}

/**
 * Test connection to a downstream system
 */
export async function testConnection(
  connectorId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await apiRequest<{ success: boolean; message: string }>(
      `/golden-records/connectors/${connectorId}/test`,
      {
        method: 'POST',
      }
    );

    return response;
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Connection test failed',
    };
  }
}

/**
 * Check if publishing is allowed
 * Requirements: 9.4
 */
export async function canPublish(workspaceId: string): Promise<{
  allowed: boolean;
  reason?: string;
  integrityScore: number;
  unresolvedHighDriftCount: number;
}> {
  if (!workspaceId) {
    return {
      allowed: false,
      reason: 'Workspace ID is required',
      integrityScore: 0,
      unresolvedHighDriftCount: 0,
    };
  }

  try {
    const response = await apiRequest<{
      allowed: boolean;
      reason?: string;
      integrityScore: number;
      unresolvedHighDriftCount: number;
    }>(`/golden-records/${workspaceId}/can-publish`);

    return response;
  } catch (error: any) {
    return {
      allowed: false,
      reason: error.message || 'Failed to check publish status',
      integrityScore: 0,
      unresolvedHighDriftCount: 0,
    };
  }
}
