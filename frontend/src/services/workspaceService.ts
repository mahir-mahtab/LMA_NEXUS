/**
 * Workspace Service
 * Handles workspace management, member operations, and workspace isolation
 * Requirements: 2.1, 2.2, 2.3, 10.1, 10.2, 10.3
 */

import { Workspace, GovernanceRules } from '../types/workspace';
import { WorkspaceMember, Role } from '../types/user';

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
 * Create workspace input
 */
export interface CreateWorkspaceInput {
  name: string;
  currency: string;
  amount: number;
  standard: string;
  basePdfName?: string;
  document?: File; // Optional PDF/DOCX file for clause extraction
}

/**
 * Create workspace result
 */
export interface CreateWorkspaceResult {
  success: boolean;
  workspace?: Workspace;
  membership?: WorkspaceMember;
  error?: ServiceError;
}

/**
 * Invite member input
 */
export interface InviteMemberInput {
  workspaceId: string;
  email: string;
  role: Role;
}

/**
 * Invite member result
 */
export interface InviteMemberResult {
  success: boolean;
  member?: WorkspaceMember;
  error?: ServiceError;
}

/**
 * Change role input
 */
export interface ChangeRoleInput {
  workspaceId: string;
  memberId: string;
  newRole: Role;
}

/**
 * Change role result
 */
export interface ChangeRoleResult {
  success: boolean;
  member?: WorkspaceMember;
  error?: ServiceError;
}

/**
 * Remove member result
 */
export interface RemoveMemberResult {
  success: boolean;
  error?: ServiceError;
}

/**
 * Update governance rules result
 */
export interface UpdateGovernanceRulesResult {
  success: boolean;
  workspace?: Workspace;
  error?: ServiceError;
}

/**
 * Get stored access token
 */
function getAccessToken(): string | null {
  return localStorage.getItem('lma_access_token');
}

/**
 * Make authenticated API request
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: ServiceError }> {
  const token = getAccessToken();

  if (!token) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'No authentication token found',
      },
    };
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    // Handle 204 No Content
    if (response.status === 204) {
      return { success: true };
    }

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: {
          code: data.error?.code || 'API_ERROR',
          message: data.error?.message || 'Request failed',
          details: data.error?.details,
        },
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network request failed',
      },
    };
  }
}

/**
 * List all workspaces where the user has active membership
 * Requirements: 2.1
 */
export async function listWorkspacesForUser(userId: string): Promise<Workspace[]> {
  if (!userId) {
    return [];
  }

  const response = await apiRequest<{ workspaces: Workspace[] }>('/workspaces');

  if (!response.success || !response.data) {
    console.error('Failed to fetch workspaces:', response.error);
    return [];
  }

  return response.data.workspaces;
}

/**
 * Get a workspace by ID
 */
export async function getWorkspace(workspaceId: string): Promise<Workspace | null> {
  if (!workspaceId) {
    return null;
  }

  const response = await apiRequest<{ workspace: Workspace }>(`/workspaces/${workspaceId}`);

  if (!response.success || !response.data) {
    console.error('Failed to fetch workspace:', response.error);
    return null;
  }

  return response.data.workspace;
}

/**
 * Create a new workspace
 * Assigns creator as Agent with isAdmin=true
 * Supports optional PDF/DOCX file upload for clause extraction
 * Requirements: 2.2, 2.3
 */
export async function createWorkspace(
  input: CreateWorkspaceInput,
  creatorUserId: string
): Promise<CreateWorkspaceResult> {
  // Validate inputs
  if (!input.name || !input.name.trim()) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Workspace name is required',
      },
    };
  }

  if (!input.currency || !input.currency.trim()) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Currency is required',
      },
    };
  }

  if (input.amount === undefined || input.amount <= 0) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Amount must be a positive number',
      },
    };
  }

  if (!input.standard || !input.standard.trim()) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Standard is required',
      },
    };
  }

  const token = getAccessToken();
  if (!token) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'No authentication token found',
      },
    };
  }

  try {
    // Use FormData if a document file is provided, otherwise use JSON
    let requestOptions: RequestInit;
    
    if (input.document) {
      // Use FormData for file upload
      const formData = new FormData();
      formData.append('name', input.name);
      formData.append('currency', input.currency);
      formData.append('amount', input.amount.toString());
      formData.append('standard', input.standard);
      if (input.basePdfName) {
        formData.append('basePdfName', input.basePdfName);
      }
      formData.append('document', input.document);
      
      requestOptions = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type - browser will set it with boundary for multipart
        },
        body: formData,
      };
    } else {
      // Use JSON for regular request
      requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: input.name,
          currency: input.currency,
          amount: input.amount,
          standard: input.standard,
          basePdfName: input.basePdfName,
        }),
      };
    }

    const response = await fetch(`${API_BASE_URL}/workspaces`, requestOptions);
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: {
          code: data.error?.code || 'API_ERROR',
          message: data.error?.message || 'Request failed',
          details: data.error?.details,
        },
      };
    }

    return {
      success: true,
      workspace: data.workspace,
      membership: data.membership,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network request failed',
      },
    };
  }
}

/**
 * Invite a member to a workspace
 * Requirements: 10.1
 */
export async function inviteMember(
  input: InviteMemberInput,
  inviterUserId: string
): Promise<InviteMemberResult> {
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

  if (!input.email || !input.email.trim()) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Email is required',
      },
    };
  }

  if (!input.role) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Role is required',
      },
    };
  }

  const validRoles: Role[] = ['agent', 'legal', 'risk', 'investor'];
  if (!validRoles.includes(input.role)) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid role',
      },
    };
  }

  const response = await apiRequest<{ member: WorkspaceMember }>(
    `/workspaces/${input.workspaceId}/members`,
    {
      method: 'POST',
      body: JSON.stringify({
        email: input.email,
        role: input.role,
      }),
    }
  );

  if (!response.success || !response.data) {
    return {
      success: false,
      error: response.error || {
        code: 'INVITE_FAILED',
        message: 'Failed to invite member',
      },
    };
  }

  return {
    success: true,
    member: response.data.member,
  };
}

/**
 * List all members of a workspace
 */
export async function listMembers(workspaceId: string): Promise<WorkspaceMember[]> {
  if (!workspaceId) {
    return [];
  }

  const response = await apiRequest<{ members: WorkspaceMember[] }>(`/workspaces/${workspaceId}/members`);

  if (!response.success || !response.data) {
    console.error('Failed to fetch members:', response.error);
    return [];
  }

  return response.data.members;
}

/**
 * Get list of users in a workspace (for dropdowns/filters)
 * Uses the members endpoint and extracts user info
 */
export async function getWorkspaceUsers(workspaceId: string): Promise<Array<{ id: string; name: string }>> {
  if (!workspaceId) {
    return [];
  }

  const members = await listMembers(workspaceId);

  // Extract unique users from members (in case of duplicates)
  const usersMap = new Map<string, { id: string; name: string }>();
  
  for (const member of members) {
    if (member.user && !usersMap.has(member.userId)) {
      usersMap.set(member.userId, {
        id: member.userId,
        name: member.user.name,
      });
    }
  }

  return Array.from(usersMap.values());
}

/**
 * Change a member's role
 * Requirements: 10.2
 */
export async function changeRole(
  input: ChangeRoleInput,
  changerUserId: string
): Promise<ChangeRoleResult> {
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

  if (!input.memberId) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Member ID is required',
      },
    };
  }

  if (!input.newRole) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'New role is required',
      },
    };
  }

  const validRoles: Role[] = ['agent', 'legal', 'risk', 'investor'];
  if (!validRoles.includes(input.newRole)) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid role',
      },
    };
  }

  const response = await apiRequest<{ member: WorkspaceMember }>(
    `/workspaces/${input.workspaceId}/members/${input.memberId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ role: input.newRole }),
    }
  );

  if (!response.success || !response.data) {
    return {
      success: false,
      error: response.error || {
        code: 'CHANGE_ROLE_FAILED',
        message: 'Failed to change member role',
      },
    };
  }

  return {
    success: true,
    member: response.data.member,
  };
}

/**
 * Remove a member from a workspace
 * Requirements: 10.3
 */
export async function removeMember(
  workspaceId: string,
  memberId: string,
  removerUserId: string
): Promise<RemoveMemberResult> {
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

  if (!memberId) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Member ID is required',
      },
    };
  }

  const response = await apiRequest(
    `/workspaces/${workspaceId}/members/${memberId}`,
    {
      method: 'DELETE',
    }
  );

  if (!response.success) {
    return {
      success: false,
      error: response.error || {
        code: 'REMOVE_FAILED',
        message: 'Failed to remove member',
      },
    };
  }

  return {
    success: true,
  };
}

/**
 * Update governance rules for a workspace
 * Requirements: 10.4
 */
export async function updateGovernanceRules(
  workspaceId: string,
  rules: Partial<GovernanceRules>
): Promise<UpdateGovernanceRulesResult> {
  if (!workspaceId) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Workspace ID is required',
      },
    };
  }

  const response = await apiRequest<{ workspace: Workspace }>(
    `/workspaces/${workspaceId}/governance`,
    {
      method: 'PATCH',
      // Backend merges fields directly, so send the rule fields flat
      body: JSON.stringify(rules),
    }
  );

  if (!response.success || !response.data) {
    return {
      success: false,
      error: response.error || {
        code: 'UPDATE_FAILED',
        message: 'Failed to update governance rules',
      },
    };
  }

  return {
    success: true,
    workspace: response.data.workspace,
  };
}

/**
 * Get user's membership in a specific workspace
 */
export async function getUserMembership(
  workspaceId: string,
  userId: string
): Promise<WorkspaceMember | null> {
  if (!workspaceId || !userId) {
    return null;
  }

  const members = await listMembers(workspaceId);
  return members.find(m => m.userId === userId && m.status === 'active') || null;
}
