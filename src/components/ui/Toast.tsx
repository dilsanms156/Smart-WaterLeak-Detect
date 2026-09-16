'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export interface ToastProps {
  id: string;
  title: string;
  description?: string;
  type?: 'default' | 'success' | 'error' | 'warning';
  onClose: (id: string) => void;
}

export function Toast({ id, title, description, type = 'default', onClose }: ToastProps) {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [id, onClose]);

  return (
    <div
      className={cn(
        'flex w-full max-w-sm flex-col gap-1 rounded-xl border p-4 shadow-xl backdrop-blur-md transition-all',
        {
          'bg-slate-900/90 border-slate-700 text-white': type === 'default',
          'bg-emerald-950/90 border-emerald-800 text-emerald-100': type === 'success',
          'bg-red-950/90 border-red-800 text-red-100': type === 'error',
          'bg-amber-950/90 border-amber-800 text-amber-100': type === 'warning',
        }
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h4 className="text-sm font-semibold">{title}</h4>
          {description && <p className="mt-1 text-xs opacity-90">{description}</p>}
        </div>
        <button
          onClick={() => onClose(id)}
          className="rounded-lg p-1 opacity-70 hover:bg-black/10 hover:opacity-100 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// Simple Toast Provider System
type ToastContextType = {
  toast: (options: Omit<ToastProps, 'id' | 'onClose'>) => void;
};

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Omit<ToastProps, 'onClose'>[]>([]);

  const addToast = (options: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, ...options }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-0 right-0 z-50 flex flex-col gap-2 p-4 max-w-md w-full pointer-events-none sm:bottom-4 sm:right-4">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto w-full animate-in slide-in-from-right-5 fade-in-0">
            <Toast {...t} onClose={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
