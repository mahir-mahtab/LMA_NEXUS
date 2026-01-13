import React from 'react';
import { clsx } from 'clsx';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, placeholder, className, id, ...props }, ref) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
    
    const baseClasses = 'block w-full rounded-xl border-gray-300 shadow-sm transition-all duration-200 ease-in-out focus:border-primary-500 focus:ring-primary-500 focus:ring-2 focus:shadow-lg disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:focus:border-primary-400 dark:focus:ring-primary-400 dark:disabled:bg-slate-700 hover:border-gray-400 dark:hover:border-slate-500';
    
    const errorClasses = error 
      ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500 dark:border-danger-400' 
      : '';
    
    return (
      <div className="space-y-1">
        {label && (
          <label 
            htmlFor={selectId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={clsx(baseClasses, errorClasses, className)}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option 
              key={option.value} 
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
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

Select.displayName = 'Select';

export default Select;