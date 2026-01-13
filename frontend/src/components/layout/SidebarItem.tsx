/**
 * SidebarItem Component
 * Individual navigation item with icon, label, active state, and permission check
 * Requirements: 13.1
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  path: string;
  isActive: boolean;
  className?: string;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  icon,
  label,
  path,
  isActive,
  className
}) => {
  return (
    <Link
      to={path}
      className={clsx(
        'group flex items-center px-3 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900',
        {
          // Active state styling (Requirements: 13.1)
          'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 shadow-sm': isActive,
          // Inactive state styling with hover
          'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-white': !isActive,
        },
        className
      )}
    >
      {/* Icon */}
      <div className={clsx(
        'mr-3 flex-shrink-0 transition-colors duration-150',
        {
          'text-primary-600 dark:text-primary-400': isActive,
          'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300': !isActive,
        }
      )}>
        {icon}
      </div>

      {/* Label */}
      <span className="flex-1 truncate">
        {label}
      </span>

      {/* Active indicator */}
      {isActive && (
        <div className="ml-auto w-1.5 h-5 bg-primary-600 rounded-full dark:bg-primary-400 shadow-sm" />
      )}
    </Link>
  );
};

export default SidebarItem;