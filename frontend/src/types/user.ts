/**
 * Core identity types for user authentication and sessions
 * Requirements: 2.1, 3.1
 */

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Session {
  id: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export type Role = 'agent' | 'legal' | 'risk' | 'investor';

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: Role;
  isAdmin: boolean;
  status: 'active' | 'pending' | 'removed';
  invitedAt: string;
  joinedAt?: string;
  /** User details - populated by backend when fetching members */
  user?: {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;
  };
}
