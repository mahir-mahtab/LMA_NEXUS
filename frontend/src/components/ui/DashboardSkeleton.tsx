import React from 'react';

/**
 * DashboardSkeleton - Loading skeleton for Dashboard page
 * Replaces inline skeleton implementation with reusable component
 */
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="p-8 mx-auto max-w-7xl">
      <div className="mb-10 animate-fade-in-up">
        <div className="w-64 mb-3 bg-gray-200 rounded h-9 dark:bg-gray-700 animate-pulse" />
        <div className="h-6 bg-gray-200 rounded w-96 dark:bg-gray-700 animate-pulse" />
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );
};

export default DashboardSkeleton;
