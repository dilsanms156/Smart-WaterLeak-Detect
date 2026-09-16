'use client';

import { Card, CardContent } from '@/components/ui/Card';
import { AlertOctagon, CheckCircle2 } from 'lucide-react';
import type { LeakEvent } from '@/types';

interface LeakStatusProps {
  activeLeaks: LeakEvent[];
  isLoading: boolean;
}

export function LeakStatus({ activeLeaks, isLoading }: LeakStatusProps) {
  const hasLeak = activeLeaks.length > 0;

  if (isLoading) {
    return <div className="h-32 bg-slate-800 animate-pulse rounded-xl" />;
  }

  return (
    <Card className={`relative overflow-hidden transition-colors duration-500 ${hasLeak ? 'border-red-500/50 shadow-red-500/10' : 'border-emerald-500/20'}`}>
      <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${hasLeak ? 'from-red-500 to-rose-600' : 'from-emerald-500 to-teal-600'}`} />
      
      <CardContent className="p-6 relative z-10 flex items-center gap-6">
        <div className={`p-4 rounded-2xl ${hasLeak ? 'bg-red-500/20 text-red-500 shadow-[0_0_30px_-5px] shadow-red-500/30' : 'bg-emerald-500/20 text-emerald-400'}`}>
          {hasLeak ? (
            <AlertOctagon className="w-10 h-10 animate-pulse" />
          ) : (
            <CheckCircle2 className="w-10 h-10" />
          )}
        </div>
        
        <div>
          <h3 className={`text-xl font-bold tracking-tight mb-1 ${hasLeak ? 'text-red-400' : 'text-emerald-400'}`}>
            {hasLeak ? 'LEAK DETECTED' : 'SYSTEM NORMAL'}
          </h3>
          
          {hasLeak ? (
            <div className="flex flex-col gap-1">
              <p className="text-sm text-slate-300">
                Location: <span className="font-semibold text-white">{activeLeaks[0].location}</span>
              </p>
              <p className="text-xs text-red-400/80">
                Pump has been automatically shut off for safety.
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              No leaks detected across all sensor zones.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
