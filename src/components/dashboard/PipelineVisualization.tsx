'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type { SensorReading, LeakEvent } from '@/types';
import { Droplets, Activity, AlertTriangle, ArrowDown } from 'lucide-react';

interface PipelineVisualizationProps {
  reading: SensorReading | null;
  activeLeaks: LeakEvent[];
  isLoading: boolean;
}

export function PipelineVisualization({ reading, activeLeaks, isLoading }: PipelineVisualizationProps) {
  const s1 = reading?.sensor1_flow || 0;
  const s2 = reading?.sensor2_flow || 0;
  const s3 = reading?.sensor3_flow || 0;

  const leakS1S2 = activeLeaks.find(l => 
    l.location === 'Between S1 and S2' || 
    l.location === 'BETWEEN S1 AND S2' ||
    (l.location && l.location.toUpperCase().includes('S1') && l.location.toUpperCase().includes('S2'))
  );
  const leakS2S3 = activeLeaks.find(l => 
    l.location === 'Between S2 and S3' || 
    l.location === 'BETWEEN S2 AND S3' ||
    (l.location && l.location.toUpperCase().includes('S2') && l.location.toUpperCase().includes('S3'))
  );

  return (
    <Card className="col-span-full shadow-xl bg-slate-900 border-slate-700/50">
      <CardHeader className="border-b border-slate-700/50 bg-slate-800/30 pb-4">
        <CardTitle className="text-lg font-bold flex items-center gap-2 text-white">
          <Droplets className="w-5 h-5 text-cyan-400" />
          Pipeline Visualization
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 relative overflow-x-auto min-h-[300px] flex items-center justify-center">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center text-slate-500 animate-pulse">
            <Activity className="w-8 h-8 mb-2" />
            <p>Loading telemetry...</p>
          </div>
        ) : !reading ? (
          <div className="flex flex-col items-center justify-center text-slate-500">
            <p>Waiting for ESP32 telemetry...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center w-full max-w-md mx-auto space-y-1 py-2">
            
            {/* Water Source */}
            <div className="flex flex-col items-center">
              <div className="px-6 py-2 bg-blue-900/50 border border-blue-700 rounded-lg text-blue-200 font-bold tracking-widest text-sm shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                WATER SOURCE
              </div>
              <ArrowDown className="w-6 h-6 text-slate-600 my-2" />
              
              <div className="w-16 h-16 rounded-full bg-slate-800 border-4 border-slate-600 flex items-center justify-center relative shadow-lg">
                <span className="text-xs font-bold text-slate-400">PUMP</span>
              </div>
              <ArrowDown className="w-6 h-6 text-slate-600 my-2" />
            </div>

            {/* S1 */}
            <SensorNode id="S1" name="Sensor 1" flow={s1} />

            {/* Pipe S1 -> S2 */}
            <PipeSegment hasLeak={!!leakS1S2} label="Between Sensor 1 and Sensor 2" />

            {/* S2 */}
            <SensorNode id="S2" name="Sensor 2" flow={s2} />

            {/* Pipe S2 -> S3 */}
            <PipeSegment hasLeak={!!leakS2S3} label="Between Sensor 2 and Sensor 3" />

            {/* S3 */}
            <SensorNode id="S3" name="Sensor 3" flow={s3} />

            {/* Outlet */}
            <div className="flex flex-col items-center">
              <ArrowDown className="w-6 h-6 text-slate-600 my-2" />
              <div className="px-6 py-2 bg-cyan-900/30 border border-cyan-800 rounded-lg text-cyan-400 font-bold tracking-widest text-sm shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                OUTLET
              </div>
            </div>

          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SensorNode({ id, name, flow }: { id: string; name: string; flow: number }) {
  return (
    <div className="flex items-center w-full max-w-[280px]">
      <div className="flex-1 text-right pr-4">
        <div className="text-sm font-bold text-slate-300">{id}</div>
        <div className="text-xs text-slate-500">{name}</div>
      </div>
      
      <div className="w-12 h-12 shrink-0 rounded-xl bg-slate-800 border-2 border-cyan-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.2)] relative z-10">
        <Activity className="w-5 h-5 text-cyan-400" />
      </div>
      
      <div className="flex-1 pl-4">
        <div className="text-lg font-mono font-bold text-white">
          {flow.toFixed(2)}
        </div>
        <div className="text-xs text-cyan-500">L/min</div>
      </div>
    </div>
  );
}

function PipeSegment({ hasLeak, label }: { hasLeak: boolean; label: string }) {
  return (
    <div className="flex flex-col items-center w-full max-w-[280px] my-1 relative -z-0">
      {hasLeak ? (
        <div className="flex flex-col items-center w-full py-2 animate-pulse">
          <div className="flex items-center w-full justify-center gap-2">
            <div className="h-1 w-16 bg-red-500 rounded-full" />
            <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            <div className="h-1 w-16 bg-red-500 rounded-full" />
          </div>
          <div className="mt-2 text-center">
            <div className="text-xs font-bold text-red-400 uppercase tracking-widest bg-red-950/80 px-3 py-1.5 rounded-lg border border-red-900 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
              ⚠ LEAK DETECTED<br/>
              <span className="text-[10px] text-red-300/80 font-medium normal-case tracking-normal">Location: {label}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center h-12 justify-center">
          <ArrowDown className="w-6 h-6 text-cyan-700/30" />
        </div>
      )}
    </div>
  );
}
