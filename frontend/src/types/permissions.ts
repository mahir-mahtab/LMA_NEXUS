/**
 * Permission types and role-permission mapping
 * Requirements: 15.1-15.17
 */

import { Role } from './user';

export type Permission =
  // Workspace
  | 'workspace:create'
  | 'workspace:invite'
  | 'workspace:changeRole'
  | 'workspace:removeMember'
  | 'workspace:admin'
  // Drafting
  | 'draft:editText'
  | 'draft:addClause'
  | 'draft:deleteClause'
  | 'draft:lockSection'
  // Variables
  | 'variable:bind'
  | 'variable:edit'
  // Graph
  | 'graph:sync'
  | 'graph:view'
  // Drift
  | 'drift:view'
  | 'drift:viewFull'
  | 'drift:overrideBaseline'
  | 'drift:revertDraft'
  | 'drift:approve'
  // Reconciliation
  | 'recon:upload'
  | 'recon:applyReject'
  // Golden Record
  | 'golden:export'
  | 'golden:publish'
  // Audit
  | 'audit:viewFull'
  | 'audit:viewLimited'
  | 'audit:export';

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  agent: [
    'workspace:create',
    'workspace:invite',
    'workspace:changeRole',
    'workspace:removeMember',
    'workspace:admin',
    'draft:editText',
    'draft:addClause',
    'draft:deleteClause',
    'draft:lockSection',
    'variable:bind',
    'variable:edit',
    'graph:sync',
    'graph:view',
    'drift:view',
    'drift:viewFull',
    'drift:overrideBaseline',
    'drift:revertDraft',
    'recon:upload',
    'recon:applyReject',
    'golden:export',
    'golden:publish',
    'audit:viewFull',
    'audit:export',
  ],
  legal: [
    'draft:editText',
    'draft:addClause',
    'variable:bind',
    'variable:edit',
    'graph:sync',
    'graph:view',
    'drift:view',
    'drift:viewFull',
    'recon:upload',
    'recon:applyReject',
    'audit:viewFull',
  ],
  risk: [
    'graph:view',
    'drift:view',
    'drift:viewFull',
    'drift:approve',
    'golden:export',
    'audit:viewFull',
    'audit:export',
  ],
  investor: [
    'graph:view',
    'drift:view',
    'audit:viewLimited',
  ],
};

/**
 * Get permissions for a given role
 */
export function getPermissionsForRole(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if a role has a specific permission
 */
export function roleHasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
