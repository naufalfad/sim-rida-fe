'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils/cn';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}) => {
  // Prevent background scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Render to document body using a portal (must be inside browser)
  if (typeof window === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Dialog container */}
      <div
        className={cn(
          'relative z-10 w-full transform rounded-none bg-white p-4 sm:p-6 shadow-2xl transition-all dark:bg-slate-900 border dark:border-slate-800 max-h-[95vh] sm:max-h-[90vh] flex flex-col',
          {
            'max-w-md': size === 'sm',
            'max-w-lg': size === 'md',
            'max-w-2xl': size === 'lg',
            'max-w-4xl': size === 'xl',
          }
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 shrink-0">
          <div className="space-y-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold leading-6 text-slate-900 dark:text-white truncate sm:text-wrap">
              {title}
            </h3>
            {description && (
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-2 sm:line-clamp-none">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            className="rounded-none bg-transparent text-slate-400 hover:text-slate-500 focus:outline-none dark:hover:text-slate-350 p-1 shrink-0"
            onClick={onClose}
          >
            <span className="sr-only">Tutup</span>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content (Scrollable) */}
        <div className="mt-3 sm:mt-4 text-sm text-slate-700 dark:text-slate-300 overflow-y-auto flex-1 min-w-0 pr-0.5">
          {children}
        </div>

        {/* Footer */}
        {/* {footer ? (
          <div className="mt-6 flex flex-row-reverse gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            {footer}
          </div>
        ) : (
          <div className="mt-6 flex flex-row-reverse gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={onClose}>
              Tutup
            </Button>
          </div>
        )} */}
      </div>
    </div>,
    document.body
  );
};
