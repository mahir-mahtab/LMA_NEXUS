import React from 'react';
import { clsx } from 'clsx';

export interface LoadingSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'rectangular' | 'circular';
  lines?: number;
  animate?: boolean;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className,
  width,
  height,
  variant = 'rectangular',
  lines = 1,
  animate = true,
  ...props
}) => {
  const baseClasses = 'bg-gray-200 dark:bg-slate-700';
  const animateClasses = animate ? 'animate-pulse' : '';
  
  const variantClasses = {
    text: 'h-4 rounded',
    rectangular: 'rounded',
    circular: 'rounded-full'
  };
  
  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;
  
  if (variant === 'text' && lines > 1) {
    return (
      <div className={clsx('space-y-2', className)}>
        {[...Array(lines)].map((_, index) => (
          <div
            key={index}
            className={clsx(
              baseClasses,
              variantClasses[variant],
              animateClasses,
              index === lines - 1 && 'w-3/4' // Last line is shorter
            )}
            style={index === lines - 1 ? { ...style, width: '75%' } : style}
          />
        ))}
      </div>
    );
  }
  
  return (
    <div
      className={clsx(
        baseClasses,
        variantClasses[variant],
        animateClasses,
        className
      )}
      style={style}
      {...props}
    />
  );
};

// Predefined skeleton patterns for common use cases
export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={clsx('p-4 border border-gray-200 dark:border-slate-700 rounded-lg', className)}>
    <div className="animate-pulse">
      <div className="flex items-center space-x-3 mb-4">
        <LoadingSkeleton variant="circular" width={40} height={40} />
        <div className="flex-1">
          <LoadingSkeleton variant="text" width="60%" className="mb-2" />
          <LoadingSkeleton variant="text" width="40%" />
        </div>
      </div>
      <LoadingSkeleton variant="text" lines={3} />
    </div>
  </div>
);

export const SkeletonTable: React.FC<{ 
  rows?: number; 
  columns?: number; 
  className?: string 
}> = ({ 
  rows = 5, 
  columns = 4, 
  className 
}) => (
  <div className={clsx('space-y-2', className)}>
    {/* Header */}
    <div className="flex space-x-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-t-lg">
      {[...Array(columns)].map((_, i) => (
        <LoadingSkeleton key={i} variant="text" width="100%" />
      ))}
    </div>
    {/* Rows */}
    {[...Array(rows)].map((_, rowIndex) => (
      <div key={rowIndex} className="flex space-x-4 p-4 border-b border-gray-200 dark:border-slate-700">
        {[...Array(columns)].map((_, colIndex) => (
          <LoadingSkeleton key={colIndex} variant="text" width="100%" />
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonList: React.FC<{ 
  items?: number; 
  className?: string 
}> = ({ 
  items = 5, 
  className 
}) => (
  <div className={clsx('space-y-3', className)}>
    {[...Array(items)].map((_, index) => (
      <div key={index} className="flex items-center space-x-3 p-3">
        <LoadingSkeleton variant="circular" width={32} height={32} />
        <div className="flex-1">
          <LoadingSkeleton variant="text" width="70%" className="mb-1" />
          <LoadingSkeleton variant="text" width="50%" />
        </div>
      </div>
    ))}
  </div>
);

export default LoadingSkeleton;