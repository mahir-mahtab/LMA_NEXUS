/**
 * UserMenu Component
 * Profile placeholder and logout functionality
 * Requirements: 1.3
 */

import React, { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { useAuth } from '../../stores/AuthProvider';

interface UserMenuProps {
  className?: string;
}

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const LogoutIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const UserMenu: React.FC<UserMenuProps> = ({ className }) => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      // Navigation will be handled by auth state change
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
      setIsOpen(false);
    }
  };

  if (!user) {
    return null;
  }

  // Generate user initials for avatar
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  return (
    <div className={clsx('relative', className)} ref={menuRef}>
      {/* User menu trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors',
          'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
          'dark:text-gray-300 dark:hover:bg-slate-800 dark:hover:text-white',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
          {
            'bg-gray-100 text-gray-900 dark:bg-slate-800 dark:text-white': isOpen
          }
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* User avatar */}
        <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
          {user.avatarUrl ? (
            <img 
              src={user.avatarUrl} 
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            getInitials(user.name)
          )}
        </div>

        {/* User name */}
        <span className="hidden sm:block truncate max-w-32">
          {user.name}
        </span>

        {/* Dropdown arrow */}
        <ChevronDownIcon />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-slate-800 dark:ring-slate-700 z-50">
          <div className="py-1">
            {/* User info header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-medium">
                  {user.avatarUrl ? (
                    <img 
                      src={user.avatarUrl} 
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    getInitials(user.name)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Menu items */}
            <div className="py-1">
              {/* Profile placeholder - disabled for now */}
              <button
                disabled
                className="flex items-center w-full px-4 py-2 text-sm text-gray-400 dark:text-gray-500 cursor-not-allowed"
              >
                <UserIcon />
                <span className="ml-3">Profile Settings</span>
                <span className="ml-auto text-xs">(Coming Soon)</span>
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={clsx(
                  'flex items-center w-full px-4 py-2 text-sm transition-colors',
                  'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
                  'dark:text-gray-300 dark:hover:bg-slate-700 dark:hover:text-white',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                <LogoutIcon />
                <span className="ml-3">
                  {isLoggingOut ? 'Signing out...' : 'Sign out'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;