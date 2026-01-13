import React from 'react';
import { clsx } from 'clsx';

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  className?: string;
}

const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  disabled = false,
  label,
  description,
  className,
}) => {
  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  return (
    <div className={clsx('flex items-start', className)}>
      <div className="flex items-center h-5">
        <button
          type="button"
          className={clsx(
            'relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
            {
              'bg-primary-600': checked && !disabled,
              'bg-gray-200 dark:bg-gray-700': !checked && !disabled,
              'bg-gray-100 dark:bg-gray-800 cursor-not-allowed': disabled,
            }
          )}
          role="switch"
          aria-checked={checked}
          aria-disabled={disabled}
          onClick={handleToggle}
          disabled={disabled}
        >
          <span
            className={clsx(
              'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200',
              {
                'translate-x-5': checked,
                'translate-x-0': !checked,
              }
            )}
          />
        </button>
      </div>
      
      {(label || description) && (
        <div className="ml-3">
          {label && (
            <label className={clsx(
              'text-sm font-medium',
              disabled 
                ? 'text-gray-400 dark:text-gray-600' 
                : 'text-gray-900 dark:text-white cursor-pointer'
            )}>
              {label}
            </label>
          )}
          {description && (
            <p className={clsx(
              'text-sm',
              disabled 
                ? 'text-gray-300 dark:text-gray-700' 
                : 'text-gray-500 dark:text-gray-400'
            )}>
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Toggle;