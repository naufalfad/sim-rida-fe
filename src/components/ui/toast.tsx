'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto close after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-none border p-4 shadow-lg transition-all animate-slide-in-right bg-white dark:bg-slate-900',
              {
                'border-emerald-250 bg-emerald-50/90 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/90 dark:text-emerald-100':
                  t.type === 'success',
                'border-red-250 bg-rose-50/90 text-red-900 dark:border-red-900/50 dark:bg-rose-950/90 dark:text-rose-100':
                  t.type === 'error',
                'border-amber-250 bg-amber-50/90 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/90 dark:text-amber-100':
                  t.type === 'warning',
                'border-blue-250 bg-blue-50/90 text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/90 dark:text-blue-100':
                  t.type === 'info',
              }
            )}
          >
            {/* Icon */}
            <span className="flex-shrink-0 mt-0.5">
              {t.type === 'success' && <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
              {t.type === 'error' && <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-450" />}
              {t.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
              {t.type === 'info' && <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
            </span>

            {/* Message */}
            <p className="flex-1 text-sm font-medium leading-5">{t.message}</p>

            {/* Close Button */}
            <button
              type="button"
              className="flex-shrink-0 ml-4 rounded-none inline-flex text-slate-400 hover:text-slate-500 focus:outline-none"
              onClick={() => removeToast(t.id)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
