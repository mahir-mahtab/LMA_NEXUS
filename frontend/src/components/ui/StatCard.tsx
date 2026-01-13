/**
 * StatCard Component
 * Dashboard KPI display with icon, label, value, badge, and optional navigation
 * Requirements: 5.2
 */

import React from 'react';
import Badge from './Badge';
import Card from './Card';

export interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  badge?: string;
  badgeVariant?: 'role' | 'severity' | 'status';
  onClick?: () => void;
  trend?: {
    direction: 'up' | 'down';
    value: string;
  };
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  badge,
  badgeVariant = 'status',
  onClick,
  trend,
  className = '',
}) => {
  const isClickable = !!onClick;

  return (
    <Card
      onClick={onClick}
      className={`
        group relative overflow-hidden border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900
        ${isClickable ? 'cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-in-out hover:border-primary-200 dark:hover:border-primary-700' : ''}
        ${className}
      `}
      padding="none"
    >
      {/* Subtle background pattern/glow */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/5 blur-2xl rounded-full -mr-12 -mt-12 group-hover:bg-primary-500/10 transition-colors"></div>
      
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-colors">
              <div className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {icon}
              </div>
            </div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {label}
            </p>
          </div>
          {badge && (
            <Badge variant={badgeVariant} value={badge} className="font-bold border-none" />
          )}
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {value}
            </p>
            {trend && (
              <div
                className={`flex items-center mt-2 text-xs font-bold ${
                  trend.direction === 'up'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-danger-600 dark:text-danger-400'
                }`}
              >
                <div className={`p-0.5 rounded-md mr-1.5 ${
                  trend.direction === 'up' ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-danger-50 dark:bg-danger-900/20'
                }`}>
                  {trend.direction === 'up' ? (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  )}
                </div>
                {trend.value}
              </div>
            )}
          </div>
          
          {isClickable && (
            <div className="w-7 h-7 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
              <svg className="w-3.5 h-3.5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default StatCard;