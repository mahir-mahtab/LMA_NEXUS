/**
 * WorkspaceLayout Component
 * Layout specifically for workspace-scoped routes with full navigation
 * Requirements: 13.1, 13.2, 13.3
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import { clsx } from 'clsx';
import Sidebar from '../../components/layout/Sidebar';
import TopBar from '../../components/layout/TopBar';
import Breadcrumbs from '../../components/layout/Breadcrumbs';

interface WorkspaceLayoutProps {
  className?: string;
}

const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({ className }) => {
  return (
    <div className={clsx(
      'min-h-screen bg-gray-50 dark:bg-slate-950 flex',
      className
    )}>
      {/* Sidebar Navigation */}
      <Sidebar className="flex-shrink-0" />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <TopBar />

        {/* Content Area */}
        <main className="flex-1 flex flex-col">
          {/* Breadcrumbs */}
          <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-6 py-3">
            <Breadcrumbs />
          </div>

          {/* Page Content */}
          <div className="flex-1 p-6 overflow-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default WorkspaceLayout;