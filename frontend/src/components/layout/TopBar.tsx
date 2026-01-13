/**
 * TopBar Component
 * Deal name, standard label, role badge, theme toggle, and user menu
 * Requirements: 13.2
 */

import React from 'react';
import { clsx } from 'clsx';
import { useWorkspace } from '../../stores/WorkspaceProvider';
import { usePermission } from '../../stores/PermissionProvider';
import Badge from '../ui/Badge';
import ThemeToggle from './ThemeToggle';
import UserMenu from './UserMenu';
import GlobalSearch from './GlobalSearch';

interface TopBarProps {
  className?: string;
}

const TopBar: React.FC<TopBarProps> = ({ className }) => {
  const { activeWorkspace, currentMembership } = useWorkspace();
  const { role } = usePermission();

  // Don't render if no active workspace
  if (!activeWorkspace || !currentMembership) {
    return null;
  }

  // Format role display name
  const getRoleDisplayName = (role: string): string => {
    switch (role) {
      case 'agent':
        return 'Agent/Lead Arranger';
      case 'legal':
        return 'Legal Counsel';
      case 'risk':
        return 'Risk/Credit';
      case 'investor':
        return 'Investor/LP';
      default:
        return role;
    }
  };

  // Format currency amount
  const formatAmount = (amount: number, currency: string): string => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    
    // Convert to millions for display
    const amountInMillions = amount / 1000000;
    return `${formatter.format(amountInMillions)}M`;
  };

  return (
    <header className={clsx(
      'flex items-center justify-between h-16 px-6 bg-white border-b border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-sm',
      className
    )}>
      {/* Left side - Deal information */}
      <div className="flex items-center space-x-4">
        {/* Deal name and amount */}
        <div className="flex flex-col">
          <h1 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
            {activeWorkspace.name}
          </h1>
          <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {formatAmount(activeWorkspace.amount, activeWorkspace.currency)}
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="font-medium">{activeWorkspace.standard}</span>
          </div>
        </div>

        {/* Role badge */}
        {role && (
          <div className="flex items-center space-x-2">
            <Badge 
              variant="role" 
              value={getRoleDisplayName(role)}
              className="font-bold border-none shadow-sm"
            />
            {currentMembership.isAdmin && (
              <Badge 
                variant="status" 
                value="Admin"
                className="font-bold border-none bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
              />
            )}
          </div>
        )}
      </div>

      {/* Center - Global Search */}
      <div className="flex-1 max-w-md mx-8">
        <GlobalSearch />
      </div>

      {/* Right side - Controls and user menu */}
      <div className="flex items-center space-x-3">
        {/* Theme toggle */}
        <ThemeToggle />

        {/* Divider */}
        <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />

        {/* User menu */}
        <UserMenu />
      </div>
    </header>
  );
};

export default TopBar;