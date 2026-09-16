'use client';

import { formatTimestamp } from '@/lib/utils';
import type { PumpEvent } from '@/types';
import { Power, PowerOff, ShieldAlert, Cpu } from 'lucide-react';

interface PumpHistoryProps {
  events: PumpEvent[];
  isLoading: boolean;
}

export function PumpHistory({ events, isLoading }: PumpHistoryProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-slate-800 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400 bg-slate-900/50 rounded-lg border border-slate-800">
        No pump events recorded.
      </div>
    );
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'MANUAL': return <Cpu className="w-4 h-4 text-cyan-400" />;
      case 'AUTOMATIC_SAFETY': return <ShieldAlert className="w-4 h-4 text-red-400" />;
      default: return <Cpu className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-slate-400 bg-slate-900/80 uppercase">
          <tr>
            <th className="px-4 py-3 rounded-tl-lg">Time</th>
            <th className="px-4 py-3">Action</th>
            <th className="px-4 py-3">Source</th>
            <th className="px-4 py-3 rounded-tr-lg">State Change</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id} className="border-b border-slate-800 bg-slate-900/30 hover:bg-slate-800/50 transition-colors">
              <td className="px-4 py-3 font-medium text-slate-200">
                {formatTimestamp(event.created_at)}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {event.action === 'ON' ? (
                    <Power className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <PowerOff className="w-4 h-4 text-red-400" />
                  )}
                  <span className={event.action === 'ON' ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                    {event.action}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {getSourceIcon(event.source)}
                  <span className="text-slate-300">
                    {event.source.replace('_', ' ')}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-slate-400">
                {event.previous_state === null ? '—' : (event.previous_state ? 'ON' : 'OFF')}
                <span className="mx-2">→</span>
                <span className={event.new_state ? 'text-emerald-400' : 'text-slate-400'}>
                  {event.new_state ? 'ON' : 'OFF'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
