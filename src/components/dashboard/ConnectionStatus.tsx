'use client';

import { formatTimestamp } from '@/lib/utils';
import { Wifi, WifiOff } from 'lucide-react';

interface ConnectionStatusProps {
  isOnline: boolean;
  lastSeen: string | null;
}

export function ConnectionStatus({ isOnline, lastSeen }: ConnectionStatusProps) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${isOnline ? 'bg-slate-900 border-slate-800' : 'bg-red-950/30 border-red-900/50'}`}>
      <div className={`p-2 rounded-lg ${isOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-500'}`}>
        {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
      </div>
      <div>
        <h4 className="text-sm font-semibold text-white">
          {isOnline ? 'Device Connected' : 'Device Offline'}
        </h4>
        <p className="text-xs text-slate-400">
          Last updated: {lastSeen ? formatTimestamp(lastSeen) : 'Never'}
        </p>
      </div>
    </div>
  );
}
