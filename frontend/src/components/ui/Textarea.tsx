import React from 'react';
import { clsx } from 'clsx';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, resize = 'vertical', className, id, ...props }, ref) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    
    const baseClasses = 'block w-full rounded-md border-gray-300 shadow-sm transition-colors focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder-gray-400 dark:focus:border-primary-400 dark:focus:ring-primary-400 dark:disabled:bg-slate-700';
    
    const errorClasses = error 
      ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500 dark:border-danger-400' 
      : '';
    
    const resizeClasses = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize'
    };
    
    return (
      <div className="space-y-1">
        {label && (
          <label 
            htmlFor={textareaId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={clsx(baseClasses, errorClasses, resizeClasses[resize], className)}
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

Textarea.displayName = 'Textarea';

export default Textarea;