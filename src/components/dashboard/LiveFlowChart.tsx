'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Activity } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface LiveFlowChartProps {
  deviceId: string;
}

type TimeRange = '1H' | '6H' | '24H' | '7D';

interface ChartDataPoint {
  time: string;
  S1: number;
  S2: number;
  S3: number;
}

export function LiveFlowChart({ deviceId }: LiveFlowChartProps) {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('1H');
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      
      const now = new Date();
      const startTime = new Date();
      if (timeRange === '1H') startTime.setHours(now.getHours() - 1);
      if (timeRange === '6H') startTime.setHours(now.getHours() - 6);
      if (timeRange === '24H') startTime.setHours(now.getHours() - 24);
      if (timeRange === '7D') startTime.setDate(now.getDate() - 7);

      const { data: readings, error: supabaseError } = await supabase
        .from('sensor_readings')
        .select('recorded_at, sensor1_flow, sensor2_flow, sensor3_flow')
        .eq('device_id', deviceId)
        .gte('recorded_at', startTime.toISOString())
        .order('recorded_at', { ascending: true });

      if (supabaseError) throw supabaseError;

      const formattedData = readings.map(r => {
        const d = new Date(r.recorded_at);
        const timeStr = timeRange === '7D' || timeRange === '24H' 
          ? `${d.getMonth()+1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
          : `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        
        return {
          time: timeStr,
          S1: r.sensor1_flow,
          S2: r.sensor2_flow,
          S3: r.sensor3_flow,
        };
      });

      setData(formattedData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch telemetry data');
    } finally {
      setLoading(false);
    }
  }, [deviceId, timeRange]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();

    // Setup realtime if on 1H to show live updates
    if (timeRange === '1H') {
      const supabase = createClient();
      const channel = supabase
        .channel('chart-realtime')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'sensor_readings', filter: `device_id=eq.${deviceId}` },
          (payload) => {
            const r = payload.new;
            const d = new Date(r.recorded_at || Date.now());
            const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
            const newData = { time: timeStr, S1: r.sensor1_flow, S2: r.sensor2_flow, S3: r.sensor3_flow };
            
            setData(prev => {
              const updated = [...prev, newData];
              // Optional: trim old data
              return updated.slice(-1000); 
            });
          }
        )
        .subscribe();
      
      return () => { supabase.removeChannel(channel); };
    }
  }, [deviceId, timeRange, fetchData]);

  const ranges: TimeRange[] = ['1H', '6H', '24H', '7D'];

  return (
    <Card className="shadow-xl bg-slate-900 border-slate-700/50">
      <CardHeader className="border-b border-slate-700/50 bg-slate-800/30 flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-4">
        <CardTitle className="text-lg font-bold flex items-center gap-2 text-white">
          <Activity className="w-5 h-5 text-cyan-400" />
          LIVE FLOW MONITORING
        </CardTitle>
        <div className="flex gap-2">
          {ranges.map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border",
                timeRange === range 
                  ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]" 
                  : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white"
              )}
            >
              {range}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="h-[400px] w-full relative">
          {loading && data.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
              <Activity className="w-8 h-8 animate-pulse mb-2 text-cyan-500/50" />
              Loading telemetry...
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex items-center justify-center text-red-400 bg-red-950/20 rounded-xl">
              {error}
            </div>
          ) : data.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-slate-500">
              No sensor data available for this time range.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickMargin={10}
                  tick={{ fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickFormatter={(val) => `${val}`}
                  tick={{ fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '14px', fontWeight: 'bold' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Line type="monotone" dataKey="S1" name="Sensor 1" stroke="#06b6d4" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="S2" name="Sensor 2" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="S3" name="Sensor 3" stroke="#6366f1" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
