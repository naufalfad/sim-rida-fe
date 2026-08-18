import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'outline';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'secondary',
  children,
  ...props
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset transition-all',
        {
          // Primary / Blue
          'bg-blue-50 text-blue-700 ring-blue-700/10 dark:bg-blue-900/20 dark:text-blue-300 dark:ring-blue-500/20':
            variant === 'primary',
          // Secondary / Gray
          'bg-slate-50 text-slate-600 ring-slate-500/10 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700':
            variant === 'secondary',
          // Success / Green
          'bg-emerald-50 text-emerald-700 ring-emerald-600/10 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-500/20':
            variant === 'success',
          // Danger / Red
          'bg-rose-50 text-rose-700 ring-rose-600/10 dark:bg-rose-950/30 dark:text-rose-400 dark:ring-rose-500/20':
            variant === 'danger',
          // Warning / Yellow
          'bg-amber-50 text-amber-800 ring-amber-600/10 dark:bg-amber-950/30 dark:text-amber-400 dark:ring-amber-500/20':
            variant === 'warning',
          // Info / Indigo
          'bg-indigo-50 text-indigo-700 ring-indigo-600/10 dark:bg-indigo-950/30 dark:text-indigo-400 dark:ring-indigo-500/20':
            variant === 'info',
          // Outline
          'bg-transparent text-slate-700 border border-slate-300 dark:text-slate-300 dark:border-slate-700':
            variant === 'outline',
        },
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
