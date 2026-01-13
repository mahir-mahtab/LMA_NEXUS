/**
 * Workspace Provider
 * Manages active workspace state, workspace selection, creation, and route sync
 * Requirements: 2.4, 2.5
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Workspace } from '../types/workspace';
import { WorkspaceMember } from '../types/user';
import * as workspaceService from '../services/workspaceService';
import { useAuth } from './AuthProvider';

const WORKSPACE_STORAGE_KEY = 'lma-nexus-active-workspace';

interface WorkspaceContextValue {
  activeWorkspace: Workspace | null;
  activeWorkspaceId: string | null;
  workspaces: Workspace[];
  currentMembership: WorkspaceMember | null;
  isLoading: boolean;
  error: string | null;
  selectWorkspace: (workspaceId: string) => Promise<boolean>;
  clearWorkspace: () => void;
  createWorkspace: (input: workspaceService.CreateWorkspaceInput) => Promise<{ success: boolean; workspace?: Workspace; error?: string }>;
  refreshWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

interface WorkspaceProviderProps {
  children: ReactNode;
}

export function WorkspaceProvider({ children }: WorkspaceProviderProps) {
  const { user, isAuthenticated } = useAuth();
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentMembership, setCurrentMembership] = useState<WorkspaceMember | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load workspaces when user is authenticated
  // silent: if true, don't show loading indicator (used during workspace creation)
  const loadWorkspaces = useCallback(async (silent: boolean = false) => {
    if (!user) return;
    
    if (!silent) {
      setIsLoading(true);
    }
    setError(null);
    
    try {
      const userWorkspaces = await workspaceService.listWorkspacesForUser(user.id);
      setWorkspaces(userWorkspaces);
    } catch (err) {
      console.error('Failed to load workspaces:', err);
      setError('Failed to load workspaces');
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadWorkspaces();
    } else {
      // Clear workspace state when user logs out
      setWorkspaces([]);
      setActiveWorkspace(null);
      setCurrentMembership(null);
      localStorage.removeItem(WORKSPACE_STORAGE_KEY);
    }
  }, [isAuthenticated, loadWorkspaces, user]);

  const selectWorkspaceInternal = useCallback(async (workspaceId: string): Promise<boolean> => {
    if (!user) return false;

    setIsLoading(true);
    setError(null);

    try {
      // Get workspace details
      const workspace = await workspaceService.getWorkspace(workspaceId);
      if (!workspace) {
        setError('Workspace not found');
        return false;
      }

      // Get user's membership in this workspace
      const membership = await workspaceService.getUserMembership(workspaceId, user.id);
      if (!membership) {
        setError('You do not have access to this workspace');
        return false;
      }

      // Clear previous workspace state and set new one (Requirements: 2.5)
      setActiveWorkspace(workspace);
      setCurrentMembership(membership);
      localStorage.setItem(WORKSPACE_STORAGE_KEY, workspaceId);
      
      return true;
    } catch (err) {
      console.error('Failed to select workspace:', err);
      setError('Failed to select workspace');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const selectWorkspace = useCallback(async (workspaceId: string): Promise<boolean> => {
    return selectWorkspaceInternal(workspaceId);
  }, [selectWorkspaceInternal]);

  // Restore active workspace from localStorage
  useEffect(() => {
    const restoreWorkspace = async () => {
      if (!isAuthenticated || !user || workspaces.length === 0) return;

      const storedWorkspaceId = localStorage.getItem(WORKSPACE_STORAGE_KEY);
      if (storedWorkspaceId) {
        // Verify the workspace exists and user has access
        const workspace = workspaces.find(w => w.id === storedWorkspaceId);
        if (workspace) {
          await selectWorkspaceInternal(storedWorkspaceId);
        } else {
          // Stored workspace no longer accessible - clear it
          localStorage.removeItem(WORKSPACE_STORAGE_KEY);
        }
      }
    };

    restoreWorkspace();
  }, [isAuthenticated, selectWorkspaceInternal, user, workspaces]);

  const clearWorkspace = useCallback(() => {
    setActiveWorkspace(null);
    setCurrentMembership(null);
    localStorage.removeItem(WORKSPACE_STORAGE_KEY);
  }, []);

  const createWorkspace = useCallback(async (
    input: workspaceService.CreateWorkspaceInput
  ): Promise<{ success: boolean; workspace?: Workspace; error?: string }> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Don't set global isLoading here - the cinematic loader handles loading state
    setError(null);

    try {
      const result = await workspaceService.createWorkspace(input, user.id);
      
      if (result.success && result.workspace) {
        // Refresh workspaces list silently (cinematic loader handles UI)
        await loadWorkspaces(true);
        return { success: true, workspace: result.workspace };
      }
      
      return { 
        success: false, 
        error: result.error?.message || 'Failed to create workspace' 
      };
    } catch (err) {
      console.error('Failed to create workspace:', err);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }, [loadWorkspaces, user]);

  const refreshWorkspaces = useCallback(async () => {
    await loadWorkspaces();
  }, [loadWorkspaces]);

  const value: WorkspaceContextValue = {
    activeWorkspace,
    activeWorkspaceId: activeWorkspace?.id || null,
    workspaces,
    currentMembership,
    isLoading,
    error,
    selectWorkspace,
    clearWorkspace,
    createWorkspace,
    refreshWorkspaces,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

/**
 * Hook to access workspace context
 */
export function useWorkspace(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}

export { WORKSPACE_STORAGE_KEY };
