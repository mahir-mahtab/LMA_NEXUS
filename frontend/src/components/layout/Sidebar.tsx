/**
 * Sidebar Component
 * Navigation items with active highlight and RBAC-aware item visibility
 * Requirements: 13.1, 3.3
 */

import React from 'react';
import { useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { usePermission } from '../../stores/PermissionProvider';
import { useWorkspace } from '../../stores/WorkspaceProvider';
import SidebarItem from './SidebarItem';
import { Permission } from '../../types/permissions';

// Navigation item definition
interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  permission?: Permission;
  requiredPermissions?: Permission[];
}

// Icons for navigation items
const DashboardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
  </svg>
);

const DraftingIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const GraphIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

const DriftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const ReconciliationIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const GoldenRecordIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const AdminIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const AuditIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const location = useLocation();
  const { canAny } = usePermission();
  const { activeWorkspaceId } = useWorkspace();

  // Don't render sidebar if no active workspace
  if (!activeWorkspaceId) {
    return null;
  }

  // Define navigation items with their required permissions
  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: `/app/workspaces/${activeWorkspaceId}/dashboard`,
      icon: <DashboardIcon />,
      // Dashboard is accessible to all authenticated users
    },
    {
      id: 'drafting',
      label: 'Nexus-Sync Drafting',
      path: `/app/workspaces/${activeWorkspaceId}/drafting`,
      icon: <DraftingIcon />,
      // Drafting requires at least view access (all roles have graph:view)
      requiredPermissions: ['graph:view'],
    },
    {
      id: 'impact-map',
      label: 'Impact Map',
      path: `/app/workspaces/${activeWorkspaceId}/impact-map`,
      icon: <GraphIcon />,
      requiredPermissions: ['graph:view'],
    },
    {
      id: 'commercial-drift',
      label: 'Commercial Drift',
      path: `/app/workspaces/${activeWorkspaceId}/commercial-drift`,
      icon: <DriftIcon />,
      requiredPermissions: ['drift:view'],
    },
    {
      id: 'ai-reconciliation',
      label: 'AI Reconciliation',
      path: `/app/workspaces/${activeWorkspaceId}/ai-reconciliation`,
      icon: <ReconciliationIcon />,
      requiredPermissions: ['recon:upload', 'recon:applyReject'],
    },
    {
      id: 'golden-record',
      label: 'Golden Record',
      path: `/app/workspaces/${activeWorkspaceId}/golden-record`,
      icon: <GoldenRecordIcon />,
      requiredPermissions: ['golden:export'],
    },
    {
      id: 'admin',
      label: 'Admin Panel',
      path: `/app/workspaces/${activeWorkspaceId}/admin`,
      icon: <AdminIcon />,
      requiredPermissions: ['workspace:admin'],
    },
    {
      id: 'audit-log',
      label: 'Audit Log',
      path: `/app/workspaces/${activeWorkspaceId}/audit-log`,
      icon: <AuditIcon />,
      requiredPermissions: ['audit:viewFull', 'audit:viewLimited'],
    },
  ];

  // Filter navigation items based on user permissions (Requirements: 3.3)
  const visibleItems = navigationItems.filter(item => {
    if (!item.requiredPermissions || item.requiredPermissions.length === 0) {
      return true; // No permissions required
    }
    return canAny(item.requiredPermissions);
  });

  return (
    <nav className={clsx(
      'flex flex-col w-64 bg-white border-r border-slate-200 dark:bg-slate-900 dark:border-slate-800',
      className
    )}>
      {/* Sidebar Header */}
      <div className="flex items-center justify-center h-16 px-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-primary-500 to-primary-600">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-extrabold text-sm tracking-tight">LMA</span>
          </div>
          <span className="text-xl font-extrabold text-white tracking-tight">
            Nexus
          </span>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
        <div className="mb-4">
          <span className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Navigation
          </span>
        </div>
        {visibleItems.map(item => (
          <SidebarItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            path={item.path}
            isActive={location.pathname === item.path}
          />
        ))}
      </div>

      {/* Exit Workspace */}
      <div className="px-3 py-4 border-t border-slate-200 dark:border-slate-800">
        <SidebarItem
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          }
          label="Exit Workspace"
          path="/app/workspaces"
          isActive={false}
        />
      </div>
    </nav>
  );
};

export default Sidebar;