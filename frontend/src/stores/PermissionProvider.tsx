/**
 * Permission Provider
 * Derives role from workspace membership and provides permission checking
 * Requirements: 3.2, 3.3
 */

import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { Role } from '../types/user';
import { Permission, getPermissionsForRole } from '../types/permissions';
import { GovernanceRules } from '../types/workspace';
import { useWorkspace } from './WorkspaceProvider';

interface PermissionContextValue {
  role: Role | null;
  isAdmin: boolean;
  permissions: Permission[];
  can: (permission: Permission) => boolean;
  canAny: (permissions: Permission[]) => boolean;
  canAll: (permissions: Permission[]) => boolean;
}

const PermissionContext = createContext<PermissionContextValue | undefined>(undefined);

interface PermissionProviderProps {
  children: ReactNode;
}

/**
 * Get effective permissions based on role, admin status, and governance rules
 */
function getEffectivePermissions(
  role: Role | null,
  isAdmin: boolean,
  governanceRules?: GovernanceRules
): Permission[] {
  if (!role) return [];

  // Start with base role permissions
  const basePermissions = [...getPermissionsForRole(role)];

  // Admin flag grants additional permissions (Requirements: 3.8)
  if (isAdmin) {
    const adminPermissions: Permission[] = [
      'workspace:invite',
      'workspace:changeRole',
      'workspace:removeMember',
      'workspace:admin',
      'draft:lockSection',
    ];
    
    adminPermissions.forEach(perm => {
      if (!basePermissions.includes(perm)) {
        basePermissions.push(perm);
      }
    });
  }

  // Apply governance rule modifications
  if (governanceRules) {
    // Legal can revert draft if governance toggle enabled (Requirements: 10.7)
    if (governanceRules.legalCanRevertDraft && role === 'legal') {
      if (!basePermissions.includes('drift:revertDraft')) {
        basePermissions.push('drift:revertDraft');
      }
    }
  }

  return basePermissions;
}

export function PermissionProvider({ children }: PermissionProviderProps) {
  const { currentMembership, activeWorkspace } = useWorkspace();

  const role = currentMembership?.role || null;
  const isAdmin = currentMembership?.isAdmin || false;
  const governanceRules = activeWorkspace?.governanceRules;

  // Compute effective permissions based on role, admin status, and governance rules
  const permissions = useMemo(() => {
    return getEffectivePermissions(role, isAdmin, governanceRules);
  }, [role, isAdmin, governanceRules]);

  // Check if user has a specific permission
  const can = useMemo(() => {
    return (permission: Permission): boolean => {
      return permissions.includes(permission);
    };
  }, [permissions]);

  // Check if user has any of the specified permissions
  const canAny = useMemo(() => {
    return (perms: Permission[]): boolean => {
      return perms.some(p => permissions.includes(p));
    };
  }, [permissions]);

  // Check if user has all of the specified permissions
  const canAll = useMemo(() => {
    return (perms: Permission[]): boolean => {
      return perms.every(p => permissions.includes(p));
    };
  }, [permissions]);

  const value: PermissionContextValue = {
    role,
    isAdmin,
    permissions,
    can,
    canAny,
    canAll,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

/**
 * Hook to access permission context
 */
export function usePermission(): PermissionContextValue {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermission must be used within a PermissionProvider');
  }
  return context;
}

/**
 * Hook to check a single permission
 */
export function useCan(permission: Permission): boolean {
  const { can } = usePermission();
  return can(permission);
}

/**
 * Hook to check multiple permissions (any)
 */
export function useCanAny(permissions: Permission[]): boolean {
  const { canAny } = usePermission();
  return canAny(permissions);
}

/**
 * Hook to check multiple permissions (all)
 */
export function useCanAll(permissions: Permission[]): boolean {
  const { canAll } = usePermission();
  return canAll(permissions);
}
