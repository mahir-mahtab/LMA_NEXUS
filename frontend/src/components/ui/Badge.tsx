import React from 'react';
import { clsx } from 'clsx';

export interface BadgeProps {
  variant?: 'role' | 'severity' | 'status';
  value: string;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ variant = 'status', value, className }) => {
  const baseClasses = 'inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border';
  
  const getVariantClasses = () => {
    switch (variant) {
      case 'role':
        switch (value.toLowerCase()) {
          case 'agent':
          case 'lead arranger':
            return 'bg-primary-50 text-primary-700 border-primary-100 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-900/30';
          case 'legal':
          case 'legal counsel':
            return 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-900/30';
          case 'risk':
          case 'risk/credit':
            return 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-900/30';
          case 'investor':
          case 'investor/lp':
            return 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30';
          default:
            return 'bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
        }
      
      case 'severity':
        switch (value.toLowerCase()) {
          case 'high':
            return 'bg-danger-50 text-danger-700 border-danger-100 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-900/30';
          case 'medium':
            return 'bg-warning-50 text-warning-700 border-warning-100 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-900/30';
          case 'low':
            return 'bg-success-50 text-success-700 border-success-100 dark:bg-success-900/20 dark:text-success-400 dark:border-success-900/30';
          default:
            return 'bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
        }
      
      case 'status':
      default:
        switch (value.toLowerCase()) {
          case 'ready':
          case 'active':
          case 'approved':
          case 'connected':
          case 'healthy':
            return 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30';
          case 'in_review':
          case 'in review':
          case 'pending':
          case 'processing':
          case 'warning':
            return 'bg-warning-50 text-warning-700 border-warning-100 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-900/30';
          case 'disconnected':
          case 'rejected':
          case 'failed':
          case 'error':
          case 'critical':
            return 'bg-danger-50 text-danger-700 border-danger-100 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-900/30';
          case 'draft':
          case 'inactive':
          case 'stable':
            return 'bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
          default:
            return 'bg-primary-50 text-primary-700 border-primary-100 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-900/30';
        }
    }
  };
  
  return (
    <span className={clsx(baseClasses, getVariantClasses(), className)}>
      {value}
    </span>
  );
};

export default Badge;