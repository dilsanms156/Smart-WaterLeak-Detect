'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { AlertTriangle, Clock } from 'lucide-react';
import type { LeakEvent } from '@/types';

interface RecentLeakEventsProps {
  recentLeaks: LeakEvent[];
  isLoading: boolean;
}

export function RecentLeakEvents({ recentLeaks, isLoading }: RecentLeakEventsProps) {
  return (
    <Card className="shadow-xl bg-slate-900 border-slate-700/50">
      <CardHeader className="border-b border-slate-700/50 bg-slate-800/30 pb-4">
        <CardTitle className="text-lg font-bold flex items-center gap-2 text-white">
          <AlertTriangle className="w-5 h-5 text-orange-400" />
          Recent Leak Events
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-8 text-slate-500 animate-pulse">
            <Clock className="w-8 h-8 mb-2 opacity-50" />
            Loading events...
          </div>
        ) : recentLeaks.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-slate-500">
            No leak events yet.
          </div>
        ) : (
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-800/50 text-slate-400 border-b border-slate-700/50">
              <tr>
                <th className="px-6 py-3 font-semibold">Time</th>
                <th className="px-6 py-3 font-semibold">Location</th>
                <th className="px-6 py-3 font-semibold">Flow Difference</th>
                <th className="px-6 py-3 font-semibold">Duration</th>
                <th className="px-6 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {recentLeaks.map((leak) => {
                const isResolved = leak.status === 'resolved';
                
                let duration = 'Ongoing';
                if (leak.ended_at) {
                  const s = new Date(leak.started_at);
                  const e = new Date(leak.ended_at);
                  const diffSec = Math.floor((e.getTime() - s.getTime()) / 1000);
                  if (diffSec < 60) duration = `${diffSec} sec`;
                  else duration = `${Math.floor(diffSec / 60)} min`;
                }

                return (
                  <tr key={leak.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-slate-300">
                      {new Date(leak.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded-md text-xs border border-slate-700 font-medium">
                        {leak.location || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-cyan-400 font-semibold">
                      {leak.flow_difference.toFixed(2)} L/min
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {duration}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        isResolved ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                      }`}>
                        {leak.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
