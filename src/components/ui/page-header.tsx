import React from 'react';
import { cn } from '@/lib/utils/cn';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, action, className }) => {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pb-4 sm:pb-5 border-b border-gray-200 dark:border-gray-800 mb-4 sm:mb-6", className)}>
      <div className="min-w-0">
        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-gray-900 dark:text-white truncate sm:text-wrap">{title}</h1>
        {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{description}</p>}
      </div>
      {action && <div className="flex flex-wrap items-center gap-2 shrink-0">{action}</div>}
    </div>
  );
};
