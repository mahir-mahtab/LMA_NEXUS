/**
 * Breadcrumbs Component
 * Navigation path display
 * Requirements: 13.3
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { useWorkspace } from '../../stores/WorkspaceProvider';

interface BreadcrumbItem {
  label: string;
  path?: string;
  isActive?: boolean;
}

interface BreadcrumbsProps {
  className?: string;
  customItems?: BreadcrumbItem[];
}

const ChevronRightIcon = () => (
  <svg className="w-4 h-4 text-slate-300 dark:text-slate-600" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
  </svg>
);

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ className, customItems }) => {
  const location = useLocation();
  const { activeWorkspace } = useWorkspace();

  // If custom items are provided, use them
  if (customItems) {
    return (
      <nav className={clsx('flex items-center space-x-2 text-sm', className)}>
        {customItems.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && <ChevronRightIcon />}
            {item.path && !item.isActive ? (
              <Link
                to={item.path}
                className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors font-medium"
              >
                {item.label}
              </Link>
            ) : (
              <span className={clsx(
                item.isActive 
                  ? 'text-slate-900 dark:text-white font-bold' 
                  : 'text-slate-500 dark:text-slate-400 font-medium'
              )}>
                {item.label}
              </span>
            )}
          </React.Fragment>
        ))}
      </nav>
    );
  }

  // Auto-generate breadcrumbs from current path
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Always start with Workspaces if we're in the app
    if (pathSegments[0] === 'app') {
      breadcrumbs.push({
        label: 'Workspaces',
        path: '/app/workspaces'
      });

      // If we're in a specific workspace
      if (pathSegments[1] === 'workspaces' && pathSegments[2] && activeWorkspace) {
        breadcrumbs.push({
          label: activeWorkspace.name,
          path: `/app/workspaces/${activeWorkspace.id}/dashboard`
        });

        // Add page-specific breadcrumb
        if (pathSegments[3]) {
          const pageLabels: Record<string, string> = {
            'dashboard': 'Dashboard',
            'drafting': 'Nexus-Sync Drafting',
            'impact-map': 'Impact Map',
            'commercial-drift': 'Commercial Drift',
            'ai-reconciliation': 'AI Reconciliation',
            'golden-record': 'Golden Record',
            'admin': 'Admin Panel',
            'audit-log': 'Audit Log'
          };

          const pageLabel = pageLabels[pathSegments[3]] || pathSegments[3];
          breadcrumbs.push({
            label: pageLabel,
            isActive: true
          });
        }
      } else if (pathSegments[1] === 'workspaces' && !pathSegments[2]) {
        // We're on the workspace hub
        breadcrumbs[breadcrumbs.length - 1].isActive = true;
      }
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Don't render if no breadcrumbs or only one item
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className={clsx('flex items-center space-x-2 text-sm', className)} aria-label="Breadcrumb">
      {breadcrumbs.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <ChevronRightIcon />}
          {item.path && !item.isActive ? (
            <Link
              to={item.path}
              className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors font-medium"
            >
              {item.label}
            </Link>
          ) : (
            <span className={clsx(
              item.isActive 
                ? 'text-slate-900 dark:text-white font-bold' 
                : 'text-slate-500 dark:text-slate-400 font-medium'
            )}>
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumbs;