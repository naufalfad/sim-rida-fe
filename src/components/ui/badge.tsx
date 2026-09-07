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
        'inline-flex items-center px-2 py-0.5 text-xs font-semibold uppercase tracking-wider border transition-all',
        {
          // Primary / Navy Blue
          'bg-[#f0f4f9] text-[#0f2c59] border-[#bfd2e6] dark:bg-slate-800 dark:text-blue-300 dark:border-slate-700':
            variant === 'primary',
          // Secondary / Gray
          'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700':
            variant === 'secondary',
          // Success / Green
          'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800':
            variant === 'success',
          // Danger / Red
          'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800':
            variant === 'danger',
          // Warning / Amber
          'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800':
            variant === 'warning',
          // Info / Slate Blue
          'bg-blue-50 text-blue-900 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800':
            variant === 'info',
          // Outline
          'bg-white text-slate-800 border-slate-300 dark:bg-transparent dark:text-slate-200 dark:border-slate-700':
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
