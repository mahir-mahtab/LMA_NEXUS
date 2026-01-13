import React from 'react';
import { clsx } from 'clsx';

export interface TableColumn {
  key: string;
  header: React.ReactNode;
  className?: string;
  sortable?: boolean;
}

export interface TableProps {
  columns: TableColumn[];
  data: Record<string, any>[];
  className?: string;
  emptyState?: React.ReactNode;
  onRowClick?: (row: Record<string, any>, index: number) => void;
  loading?: boolean;
}

const Table: React.FC<TableProps> = ({
  columns,
  data,
  className,
  emptyState,
  onRowClick,
  loading = false
}) => {
  const hasData = data && data.length > 0;
  
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="bg-gray-200 dark:bg-slate-700 h-10 rounded mb-2"></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-gray-100 dark:bg-slate-800 h-8 rounded mb-1"></div>
        ))}
      </div>
    );
  }
  
  if (!hasData && emptyState) {
    return <div className="text-center py-8">{emptyState}</div>;
  }
  
  return (
    <div className={clsx('overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg', className)}>
      <table className="min-w-full divide-y divide-gray-300 dark:divide-slate-600">
        <thead className="bg-gray-50 dark:bg-slate-800">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={clsx(
                  'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider',
                  column.className
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700">
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={clsx(
                'hover:bg-gray-50 dark:hover:bg-slate-800 transition-all duration-200 ease-in-out hover:shadow-sm',
                onRowClick && 'cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20'
              )}
              onClick={() => onRowClick?.(row, rowIndex)}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={clsx(
                    'px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100',
                    column.className
                  )}
                >
                  {row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Table subcomponents for more flexible usage
export const TableHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className
}) => (
  <thead className={clsx('bg-gray-50 dark:bg-slate-800', className)}>
    {children}
  </thead>
);

export const TableBody: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className
}) => (
  <tbody className={clsx('bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700', className)}>
    {children}
  </tbody>
);

export const TableRow: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}> = ({
  children,
  className,
  onClick,
  hover = true
}) => (
  <tr
    className={clsx(
      hover && 'hover:bg-gray-50 dark:hover:bg-slate-800 transition-all duration-200 ease-in-out hover:shadow-sm',
      onClick && 'cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20',
      className
    )}
    onClick={onClick}
  >
    {children}
  </tr>
);

export const TableCell: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
  header?: boolean;
}> = ({
  children,
  className,
  header = false
}) => {
  const Component = header ? 'th' : 'td';
  const baseClasses = header
    ? 'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'
    : 'px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100';
  
  return (
    <Component className={clsx(baseClasses, className)}>
      {children}
    </Component>
  );
};

export default Table;