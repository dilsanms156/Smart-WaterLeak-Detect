'use client';

import { formatTimestamp, formatDuration } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import type { LeakEvent } from '@/types';

interface LeakHistoryProps {
  events: LeakEvent[];
  isLoading: boolean;
}

export function LeakHistory({ events, isLoading }: LeakHistoryProps) {
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
        No leak events recorded.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-slate-400 bg-slate-900/80 uppercase">
          <tr>
            <th className="px-4 py-3 rounded-tl-lg">Time Started</th>
            <th className="px-4 py-3">Location</th>
            <th className="px-4 py-3">Flow Drop</th>
            <th className="px-4 py-3">Duration</th>
            <th className="px-4 py-3 rounded-tr-lg">Status</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id} className="border-b border-slate-800 bg-slate-900/30 hover:bg-slate-800/50 transition-colors">
              <td className="px-4 py-3 font-medium text-slate-200">
                {formatTimestamp(event.started_at)}
              </td>
              <td className="px-4 py-3 text-red-400 font-medium">
                {event.location}
              </td>
              <td className="px-4 py-3 text-slate-300">
                {event.flow_difference.toFixed(2)} L/min
              </td>
              <td className="px-4 py-3 text-slate-400">
                {formatDuration(event.started_at, event.ended_at)}
              </td>
              <td className="px-4 py-3">
                <Badge variant={event.status === 'active' ? 'destructive' : (event.status === 'resolved' ? 'success' : 'secondary')}>
                  {event.status}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
