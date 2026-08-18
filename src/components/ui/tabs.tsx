import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  variant?: 'line' | 'pill';
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className,
  variant = 'line',
}) => {
  return (
    <div
      className={cn(
        'flex overflow-x-auto scrollbar-none',
        {
          'border-b border-slate-200 dark:border-slate-800 gap-6': variant === 'line',
          'bg-slate-100 p-1 rounded-lg dark:bg-slate-850 gap-1 inline-flex': variant === 'pill',
        },
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            type="button"
            className={cn(
              'flex items-center gap-2 py-2 px-1 text-sm font-medium transition-all whitespace-nowrap focus:outline-none relative',
              {
                // Line Variant
                'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300':
                  variant === 'line' && !isActive,
                'text-blue-650 dark:text-blue-400': variant === 'line' && isActive,
                // Pill Variant
                'text-slate-650 hover:text-slate-900 rounded-md px-3 py-1.5 dark:text-slate-400 dark:hover:text-slate-200':
                  variant === 'pill' && !isActive,
                'bg-white text-blue-750 font-semibold shadow-sm rounded-md px-3 py-1.5 dark:bg-slate-900 dark:text-blue-400':
                  variant === 'pill' && isActive,
              }
            )}
          >
            {tab.icon && <span className="h-4 w-4">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  'ml-1 px-1.5 py-0.5 text-2xs rounded-full font-bold',
                  isActive
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-450'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                )}
              >
                {tab.count}
              </span>
            )}
            {/* Active underline for line variant */}
            {variant === 'line' && isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-500" />
            )}
          </button>
        );
      })}
    </div>
  );
};
