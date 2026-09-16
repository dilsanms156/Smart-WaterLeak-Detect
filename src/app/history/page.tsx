'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FlowChart } from '@/components/charts/FlowChart';
import type { TimePeriod, SensorReading } from '@/types';

const DEVICE_ID = 'water-leak-device-01';
const PERIODS: { label: string, value: TimePeriod }[] = [
  { label: '1 Hour', value: '1h' },
  { label: '6 Hours', value: '6h' },
  { label: '24 Hours', value: '24h' },
  { label: '7 Days', value: '7d' },
];

export default function HistoryPage() {
  const [period, setPeriod] = useState<TimePeriod>('1h');
  const [data, setData] = useState<SensorReading[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/readings?deviceId=${DEVICE_ID}&period=${period}&limit=1000`);
        const json = await res.json();
        
        if (!res.ok) throw new Error(json.error || 'Failed to fetch data');
        
        if (isMounted) {
          setData(json.data || []);
        }
      } catch (err) {
        if (isMounted) setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [period]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Sensor History</h1>
          <p className="text-slate-400">Historical flow rates across all sensor zones.</p>
        </div>
        
        <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800 w-full sm:w-auto overflow-x-auto">
          {PERIODS.map(p => (
            <Button
              key={p.value}
              variant={period === p.value ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPeriod(p.value)}
              className={period === p.value ? '' : 'text-slate-400'}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Flow Rate Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-12 text-red-400 bg-red-950/20 rounded-lg border border-red-900/50">
              {error}
            </div>
          ) : (
            <FlowChart data={data} isLoading={isLoading} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
