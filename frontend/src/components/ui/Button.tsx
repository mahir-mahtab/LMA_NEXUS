import React from 'react';
import { clsx } from 'clsx';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  tooltip?: string;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, children, tooltip, disabled, loading = false, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100 disabled:active:scale-100';
    
    const variantClasses = {
      primary: 'bg-primary-600 text-white hover:bg-primary-700 hover:shadow-lg focus:ring-primary-500 dark:bg-primary-500 dark:hover:bg-primary-600 dark:hover:shadow-primary-500/25',
      secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 hover:shadow-md focus:ring-primary-500 dark:bg-slate-800 dark:text-gray-200 dark:border-slate-600 dark:hover:bg-slate-700 dark:hover:border-slate-500',
      danger: 'bg-danger-600 text-white hover:bg-danger-700 hover:shadow-lg focus:ring-danger-500 dark:bg-danger-500 dark:hover:bg-danger-600 dark:hover:shadow-danger-500/25',
      ghost: 'text-gray-700 hover:bg-gray-100 hover:shadow-sm focus:ring-primary-500 dark:text-gray-200 dark:hover:bg-slate-800'
    };
    
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    };
    
    const isDisabled = disabled || loading;
    
    const buttonElement = (
      <button
        ref={ref}
        className={clsx(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        disabled={isDisabled}
        {...props}
      >
        {loading && (
          <svg 
            className="animate-spin -ml-1 mr-2 h-4 w-4" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
    
    if (tooltip && isDisabled) {
      return (
        <div className="relative group">
          {buttonElement}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            {tooltip}
          </div>
        </div>
      );
    }
    
    return buttonElement;
  }
);

Button.displayName = 'Button';

export default Button;