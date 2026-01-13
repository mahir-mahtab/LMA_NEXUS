/**
 * WorkspaceRoute Component
 * Route guard that ensures workspace context is loaded and valid
 * Requirements: 13.5, 2.6
 */

import React, { useEffect } from 'react';
import { Navigate, Outlet, useParams } from 'react-router-dom';
import { useWorkspace } from '../../stores/WorkspaceProvider';

const WorkspaceRoute: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { activeWorkspaceId, selectWorkspace, isLoading, error } = useWorkspace();

  // Load workspace when workspaceId changes
  useEffect(() => {
    if (workspaceId && workspaceId !== activeWorkspaceId) {
      selectWorkspace(workspaceId);
    }
  }, [workspaceId, activeWorkspaceId, selectWorkspace]);

  // Show loading while workspace is being loaded
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading workspace...</p>
        </div>
      </div>
    );
  }

  // Handle workspace not found or access denied
  if (error || !workspaceId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Workspace Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error || 'The workspace you are looking for does not exist or you do not have access to it.'}
            </p>
          </div>
          <Navigate to="/app/workspaces" replace />
        </div>
      </div>
    );
  }

  // Redirect if workspace ID doesn't match active workspace
  if (workspaceId !== activeWorkspaceId) {
    return <Navigate to="/app/workspaces" replace />;
  }

  return <Outlet />;
};

export default WorkspaceRoute;