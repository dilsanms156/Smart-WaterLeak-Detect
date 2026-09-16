'use client';

import { Card, CardContent } from '@/components/ui/Card';
import { Activity } from 'lucide-react';

interface SensorCardProps {
  id: string;
  name: string;
  flow: number | undefined;
  isLoading: boolean;
}

export function SensorCard({ id, name, flow, isLoading }: SensorCardProps) {
  return (
    <Card className="relative overflow-hidden group">
      {/* Background decoration */}
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-colors" />
      
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-slate-400">
            <Activity className="w-4 h-4 text-cyan-500" />
            <h3 className="text-sm font-medium">{name}</h3>
          </div>
          <div className="text-xs font-mono text-slate-500 bg-slate-800/50 px-2 py-1 rounded-md">
            {id}
          </div>
        </div>
        
        <div className="flex items-baseline gap-2">
          {isLoading ? (
            <div className="h-10 w-32 bg-slate-800 animate-pulse rounded-lg" />
          ) : (
            <>
              <span className="text-4xl font-bold text-white tracking-tight">
                {flow !== undefined ? flow.toFixed(2) : '—'}
              </span>
              <span className="text-sm text-slate-400 font-medium">L/min</span>
            </>
          )}
        </div>
        
        {/* Simple visual indicator bar */}
        <div className="mt-6 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
            style={{ width: `${Math.min(100, ((flow || 0) / 10) * 100)}%` }} // Assumes max expected flow ~10 L/min for visual scale
          />
        </div>
      </CardContent>
    </Card>
  );
}
