'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { GitCommit } from 'lucide-react';
import type { SensorReading } from '@/types';

interface FlowComparisonProps {
  reading: SensorReading | null;
  isLoading: boolean;
}

export function FlowComparison({ reading, isLoading }: FlowComparisonProps) {
  if (isLoading) {
    return <div className="h-48 bg-slate-800 animate-pulse rounded-xl" />;
  }

  const s1 = reading?.sensor1_flow || 0;
  const s2 = reading?.sensor2_flow || 0;
  const s3 = reading?.sensor3_flow || 0;

  const getDropColor = (current: number, prev: number) => {
    if (prev - current > 0.5) return 'text-red-400';
    if (prev - current > 0.2) return 'text-amber-400';
    return 'text-emerald-400';
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
          <GitCommit className="w-4 h-4" />
          Pipeline Flow Comparison
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative pt-8 pb-4 px-4">
          {/* Connecting Line */}
          <div className="absolute top-12 left-10 right-10 h-1 bg-slate-700 -z-10" />
          
          <div className="flex justify-between items-end relative z-10">
            {/* Sensor 1 */}
            <div className="flex flex-col items-center">
              <div className="mb-2 text-2xl font-bold text-white">{s1.toFixed(2)}</div>
              <div className="w-6 h-6 rounded-full bg-slate-800 border-4 border-cyan-500 mb-2 shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
              <div className="text-xs font-medium text-slate-400">S1 (INLET)</div>
            </div>

            {/* Difference S1->S2 */}
            <div className="flex-1 flex flex-col items-center -mt-6">
              <span className={`text-[10px] font-bold ${getDropColor(s2, s1)}`}>
                {s2 < s1 ? `-${(s1 - s2).toFixed(2)}` : `+${(s2 - s1).toFixed(2)}`}
              </span>
            </div>

            {/* Sensor 2 */}
            <div className="flex flex-col items-center">
              <div className="mb-2 text-2xl font-bold text-white">{s2.toFixed(2)}</div>
              <div className="w-6 h-6 rounded-full bg-slate-800 border-4 border-blue-500 mb-2 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
              <div className="text-xs font-medium text-slate-400">S2 (ZONE 1)</div>
            </div>

            {/* Difference S2->S3 */}
            <div className="flex-1 flex flex-col items-center -mt-6">
              <span className={`text-[10px] font-bold ${getDropColor(s3, s2)}`}>
                {s3 < s2 ? `-${(s2 - s3).toFixed(2)}` : `+${(s3 - s2).toFixed(2)}`}
              </span>
            </div>

            {/* Sensor 3 */}
            <div className="flex flex-col items-center">
              <div className="mb-2 text-2xl font-bold text-white">{s3.toFixed(2)}</div>
              <div className="w-6 h-6 rounded-full bg-slate-800 border-4 border-indigo-500 mb-2 shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
              <div className="text-xs font-medium text-slate-400">S3 (OUTLET)</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
