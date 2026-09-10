import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'success' | 'warning';
  showLabel?: boolean;
}

export const ProgressIndicator: React.FC<ProgressProps> = ({
  className,
  value,
  size = 'md',
  variant = 'primary',
  showLabel = false,
  ...props
}) => {
  const percentage = Math.min(Math.max(value, 0), 100);

  return (
    <div className={cn('w-full', className)} {...props}>
      <div className="flex justify-between items-center mb-1">
        {showLabel && (
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Progres
          </span>
        )}
        {showLabel && (
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {percentage}%
          </span>
        )}
      </div>
      <div
        className={cn('w-full bg-slate-100 rounded-full dark:bg-slate-800 overflow-hidden', {
          'h-1.5': size === 'sm',
          'h-2.5': size === 'md',
          'h-4': size === 'lg',
        })}
      >
        <div
          className={cn('h-full rounded-full transition-all duration-300 ease-out', {
            'bg-blue-600': variant === 'primary',
            'bg-blue-800': variant === 'success',
            'bg-blue-500': variant === 'warning',
          })}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
