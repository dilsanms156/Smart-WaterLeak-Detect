'use client';

import * as React from 'react';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in" 
        onClick={onCancel}
      />
      
      {/* Dialog */}
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900 shadow-2xl animate-in zoom-in-95">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`rounded-full p-3 ${isDestructive ? 'bg-red-500/20 text-red-500' : 'bg-cyan-500/20 text-cyan-400'}`}>
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm text-slate-400">{description}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 bg-slate-800/50 px-6 py-4">
          <Button variant="ghost" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button 
            variant={isDestructive ? 'destructive' : 'default'} 
            onClick={() => {
              onConfirm();
            }}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
