'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { LeakHistory } from '@/components/tables/LeakHistory';
import type { LeakEvent, LeakEventStatus } from '@/types';
import { AlertOctagon } from 'lucide-react';

const DEVICE_ID = 'water-leak-device-01';

export default function LeaksPage() {
  const [events, setEvents] = useState<LeakEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<LeakEventStatus | 'all'>('all');

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const statusQuery = filter !== 'all' ? `&status=${filter}` : '';
        const res = await fetch(`/api/leaks?deviceId=${DEVICE_ID}&limit=100${statusQuery}`);
        const json = await res.json();
        
        if (res.ok && isMounted) {
          setEvents(json.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch leaks', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [filter]);

  const activeCount = events.filter(e => e.status === 'active').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Leak Events</h1>
          <p className="text-slate-400">History of all detected leak conditions and their status.</p>
        </div>
        
        <select 
          value={filter}
          onChange={(e) => setFilter(e.target.value as LeakEventStatus | 'all')}
          className="bg-slate-900 border border-slate-700 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2.5 outline-none"
        >
          <option value="all">All Events</option>
          <option value="active">Active Only</option>
          <option value="resolved">Resolved Only</option>
          <option value="acknowledged">Acknowledged</option>
        </select>
      </div>

      {activeCount > 0 && filter === 'all' && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-4">
          <div className="p-2 bg-red-500/20 rounded-lg text-red-500">
            <AlertOctagon className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-red-400 font-semibold mb-1">Attention Required</h3>
            <p className="text-sm text-slate-300">
              There are {activeCount} active leak events. The pump will remain disabled until the leaks are physically resolved.
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <LeakHistory events={events} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
