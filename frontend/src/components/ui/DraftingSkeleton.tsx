import React from 'react';

/**
 * DraftingSkeleton - Loading skeleton for Drafting page
 * Replaces inline skeleton implementation with reusable component
 */
export const DraftingSkeleton: React.FC = () => {
  return (
    <div className="flex h-full">
      {/* Left Panel Skeleton */}
      <div className="min-w-[20rem] w-80 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <div className="h-6 w-44 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
      </div>

      {/* Center Panel Skeleton */}
      <div className="flex-1 p-6 bg-gray-50 dark:bg-gray-900">
        <div className="h-7 w-72 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
        <div className="space-y-2 mb-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
      </div>

      {/* Right Panel Skeleton */}
      <div className="min-w-[20rem] w-80 flex-shrink-0 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <div className="h-6 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i}>
              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
              <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DraftingSkeleton;
