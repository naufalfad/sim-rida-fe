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
          'bg-blue-600 text-white border-blue-700':
            variant === 'primary',
          // Secondary / Slate
          'bg-slate-100 text-slate-800 border-slate-300':
            variant === 'secondary',
          // Success / Solid Blue
          'bg-blue-50 text-blue-900 border-blue-300':
            variant === 'success',
          // Danger / Dark Slate
          'bg-slate-800 text-white border-black':
            variant === 'danger',
          // Warning / Blue Light
          'bg-blue-100 text-blue-900 border-blue-300':
            variant === 'warning',
          // Info / Blue Soft
          'bg-blue-50 text-blue-800 border-blue-200':
            variant === 'info',
          // Outline
          'bg-white text-slate-800 border-slate-300':
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
