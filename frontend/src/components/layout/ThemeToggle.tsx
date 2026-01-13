/**
 * ThemeToggle Component
 * Light/dark theme switch
 * Requirements: 12.1
 */

import React from 'react';
import { clsx } from 'clsx';
import { useTheme } from '../../stores/ThemeProvider';

interface ThemeToggleProps {
  className?: string;
}

const SunIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const MoonIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={clsx(
        'relative inline-flex items-center justify-center w-10 h-10 rounded-md transition-all duration-200 ease-in-out',
        'text-gray-600 hover:text-gray-900 hover:bg-gray-100 hover:shadow-sm hover:scale-105',
        'dark:text-gray-400 dark:hover:text-white dark:hover:bg-slate-800',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900',
        'active:scale-95',
        className
      )}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {/* Icon with smooth transition */}
      <div className="relative">
        {/* Sun icon (visible in dark mode) */}
        <div className={clsx(
          'absolute inset-0 transition-all duration-300 ease-in-out',
          theme === 'dark' 
            ? 'opacity-100 rotate-0 scale-100' 
            : 'opacity-0 rotate-90 scale-75'
        )}>
          <SunIcon />
        </div>
        
        {/* Moon icon (visible in light mode) */}
        <div className={clsx(
          'absolute inset-0 transition-all duration-300 ease-in-out',
          theme === 'light' 
            ? 'opacity-100 rotate-0 scale-100' 
            : 'opacity-0 -rotate-90 scale-75'
        )}>
          <MoonIcon />
        </div>
      </div>
    </button>
  );
};

export default ThemeToggle;