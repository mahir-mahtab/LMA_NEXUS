import React from 'react';
import { clsx } from 'clsx';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    
    const baseClasses = 'block w-full rounded-md border-gray-300 shadow-sm transition-all duration-200 ease-in-out focus:border-primary-500 focus:ring-primary-500 focus:ring-2 focus:shadow-lg disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder-gray-400 dark:focus:border-primary-400 dark:focus:ring-primary-400 dark:disabled:bg-slate-700 hover:border-gray-400 dark:hover:border-slate-500';
    
    const errorClasses = error 
      ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500 dark:border-danger-400' 
      : '';
    
    return (
      <div className="space-y-1">
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={clsx(baseClasses, errorClasses, className)}
          {...props}
        />
        {error && (
          <p className="text-sm text-danger-600 dark:text-danger-400">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;