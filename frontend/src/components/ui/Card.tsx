import React from 'react';
import { clsx } from 'clsx';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  border?: boolean;
  hover?: boolean;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  className,
  padding = 'md',
  shadow = 'md',
  border = true,
  hover = false,
  onClick
}) => {
  const baseClasses = 'bg-white dark:bg-slate-800 rounded-2xl transition-all duration-300 ease-in-out';
  
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };
  
  const shadowClasses = {
    none: '',
    sm: 'shadow-sm dark:shadow-soft-dark',
    md: 'shadow-soft dark:shadow-soft-dark',
    lg: 'shadow-lg dark:shadow-soft-dark'
  };
  
  const borderClasses = border 
    ? 'border border-gray-200 dark:border-slate-700' 
    : '';
  
  const hoverClasses = hover 
    ? 'hover:shadow-xl hover:shadow-soft dark:hover:shadow-soft-dark hover:-translate-y-1 hover:border-gray-300 dark:hover:border-slate-600 cursor-pointer' 
    : '';
  
  return (
    <div
      onClick={onClick}
      className={clsx(
        baseClasses,
        paddingClasses[padding],
        shadowClasses[shadow],
        borderClasses,
        hoverClasses,
        className
      )}
    >
      {children}
    </div>
  );
};

// Card subcomponents for structured content
export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className
}) => (
  <div className={clsx('border-b border-gray-200 dark:border-slate-700 pb-3 mb-4', className)}>
    {children}
  </div>
);

export const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className
}) => (
  <h3 className={clsx('text-lg font-semibold text-gray-900 dark:text-white', className)}>
    {children}
  </h3>
);

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className
}) => (
  <div className={clsx('text-gray-600 dark:text-gray-300', className)}>
    {children}
  </div>
);

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className
}) => (
  <div className={clsx('border-t border-gray-200 dark:border-slate-700 pt-3 mt-4', className)}>
    {children}
  </div>
);

export default Card;