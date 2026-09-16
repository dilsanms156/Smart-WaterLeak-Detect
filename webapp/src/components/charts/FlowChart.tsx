'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import type { SensorReading } from '@/types';

interface FlowChartProps {
  data: SensorReading[];
  isLoading: boolean;
}

export function FlowChart({ data, isLoading }: FlowChartProps) {
  if (isLoading) {
    return (
      <div className="h-[400px] w-full bg-slate-900/50 rounded-xl flex items-center justify-center border border-slate-800">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-[400px] w-full bg-slate-900/50 rounded-xl flex items-center justify-center border border-slate-800 text-slate-400">
        No flow data available for this time period
      </div>
    );
  }

  // Format data for chart
  const chartData = data.map(d => ({
    time: new Date(d.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    S1: Number(d.sensor1_flow.toFixed(2)),
    S2: Number(d.sensor2_flow.toFixed(2)),
    S3: Number(d.sensor3_flow.toFixed(2))
  }));

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis 
            dataKey="time" 
            stroke="#94a3b8" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false}
            minTickGap={30}
          />
          <YAxis 
            stroke="#94a3b8" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false}
            tickFormatter={(val) => `${val}`}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
            itemStyle={{ color: '#e2e8f0' }}
            labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Line 
            type="monotone" 
            dataKey="S1" 
            name="Sensor 1 (Inlet)" 
            stroke="#06b6d4" 
            strokeWidth={2} 
            dot={false}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="S2" 
            name="Sensor 2 (Zone 1)" 
            stroke="#3b82f6" 
            strokeWidth={2} 
            dot={false}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="S3" 
            name="Sensor 3 (Outlet)" 
            stroke="#6366f1" 
            strokeWidth={2} 
            dot={false}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
