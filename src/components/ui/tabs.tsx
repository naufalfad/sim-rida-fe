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
          'bg-slate-100 p-0.5 border border-slate-200 dark:bg-slate-850 gap-0.5 inline-flex': variant === 'pill',
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
              'flex items-center gap-2 py-2 px-1 text-xs uppercase tracking-wider font-semibold transition-all whitespace-nowrap focus:outline-none relative',
              {
                // Line Variant
                'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200':
                  variant === 'line' && !isActive,
                'text-[#0f2c59] dark:text-blue-300': variant === 'line' && isActive,
                // Pill Variant
                'text-slate-600 hover:text-slate-900 px-3 py-1.5 dark:text-slate-400 dark:hover:text-slate-200':
                  variant === 'pill' && !isActive,
                'bg-[#0f2c59] text-white px-3 py-1.5 shadow-none':
                  variant === 'pill' && isActive,
              }
            )}
          >
            {tab.icon && <span className="h-4 w-4">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  'ml-1 px-1.5 py-0.2 text-2xs font-bold border',
                  isActive
                    ? 'bg-[#0a1e3f] text-white border-transparent'
                    : 'bg-slate-200 text-slate-700 border-slate-300'
                )}
              >
                {tab.count}
              </span>
            )}
            {/* Active underline for line variant */}
            {variant === 'line' && isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0f2c59] dark:bg-blue-400" />
            )}
          </button>
        );
      })}
    </div>
  );
};
