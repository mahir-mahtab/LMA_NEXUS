/**
 * AppLayout Component
 * Main authenticated layout with sidebar, topbar, breadcrumbs, and content area
 * Requirements: 13.1, 13.2, 13.3
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import { clsx } from 'clsx';
import Sidebar from '../../components/layout/Sidebar';
import TopBar from '../../components/layout/TopBar';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import { useWorkspace } from '../../stores/WorkspaceProvider';

interface AppLayoutProps {
  className?: string;
}

const AppLayout: React.FC<AppLayoutProps> = ({ className }) => {
  const { activeWorkspaceId } = useWorkspace();

  return (
    <div className={clsx(
      'min-h-screen bg-slate-50 dark:bg-slate-950 flex',
      className
    )}>
      {/* Sidebar - Only show when in workspace context */}
      {activeWorkspaceId && (
        <Sidebar className="flex-shrink-0" />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar - Only show when in workspace context */}
        {activeWorkspaceId && (
          <TopBar />
        )}

        {/* Content Area */}
        <main className="flex-1 flex flex-col">
          {/* Breadcrumbs - Only show when in workspace context */}
          {activeWorkspaceId && (
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3">
              <Breadcrumbs />
            </div>
          )}

          {/* Page Content */}
          <div className="flex-1">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;