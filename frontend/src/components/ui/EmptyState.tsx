import React from 'react';
import { clsx } from 'clsx';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-16'
  };
  
  const iconSizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  };
  
  const titleSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };
  
  return (
    <div className={clsx('text-center', sizeClasses[size], className)}>
      {icon && (
        <div className={clsx(
          'mx-auto mb-6 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500',
          iconSizeClasses[size]
        )}>
          <div className="w-1/2 h-1/2">
            {icon}
          </div>
        </div>
      )}
      
      <h3 className={clsx(
        'font-bold text-slate-900 dark:text-white mb-2 tracking-tight',
        titleSizeClasses[size]
      )}>
        {title}
      </h3>
      
      {description && (
        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto text-lg leading-relaxed">
          {description}
        </p>
      )}
      
      {action && (
        <div className="flex justify-center">
          {action}
        </div>
      )}
    </div>
  );
};

// Predefined empty state variants for common scenarios
export const NoDataEmptyState: React.FC<{ 
  title?: string; 
  description?: string;
  action?: React.ReactNode;
}> = ({ 
  title = "No data available", 
  description = "There's nothing to show here yet.",
  action
}) => (
  <EmptyState
    icon={
      <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    }
    title={title}
    description={description}
    action={action}
  />
);

export const SearchEmptyState: React.FC<{ 
  searchTerm?: string;
  action?: React.ReactNode;
}> = ({ 
  searchTerm,
  action
}) => (
  <EmptyState
    icon={
      <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    }
    title="No results found"
    description={searchTerm ? `No results found for "${searchTerm}". Try adjusting your search.` : "No results found. Try adjusting your search criteria."}
    action={action}
  />
);

export const ErrorEmptyState: React.FC<{ 
  title?: string;
  description?: string;
  action?: React.ReactNode;
}> = ({ 
  title = "Something went wrong",
  description = "We encountered an error while loading this content.",
  action
}) => (
  <EmptyState
    icon={
      <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    }
    title={title}
    description={description}
    action={action}
  />
);

export const LoadingEmptyState: React.FC<{ 
  title?: string;
  description?: string;
}> = ({ 
  title = "Loading...",
  description = "Please wait while we load your content."
}) => (
  <EmptyState
    icon={
      <div className="animate-spin">
        <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </div>
    }
    title={title}
    description={description}
  />
);

export default EmptyState;