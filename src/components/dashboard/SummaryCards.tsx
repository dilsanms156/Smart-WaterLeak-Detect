import { Card, CardContent } from '@/components/ui/Card';
import { ShieldCheck, ShieldAlert, Power, Droplets, AlertTriangle } from 'lucide-react';
import type { SensorReading } from '@/types';

interface SummaryCardsProps {
  hasLeak: boolean;
  pumpState: boolean;
  reading: SensorReading | null;
  totalLeaks: number;
}

export function SummaryCards({ hasLeak, pumpState, reading, totalLeaks }: SummaryCardsProps) {
  const totalFlow = reading?.sensor3_flow || 0; // Using outlet as total flow

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {/* Card 1: System Status */}
      <Card className="bg-slate-900 border-slate-700/50 shadow-xl overflow-hidden relative group">
        <div className={`absolute top-0 left-0 w-1 h-full ${hasLeak ? 'bg-red-500' : 'bg-emerald-500'}`} />
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">SYSTEM STATUS</p>
              <h3 className={`text-2xl font-bold mt-1 ${hasLeak ? 'text-red-400' : 'text-emerald-400'}`}>
                {hasLeak ? 'LEAK DETECTED' : 'NORMAL'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {hasLeak ? 'Active leakage confirmed' : 'No leakage detected'}
              </p>
            </div>
            <div className={`p-3 rounded-xl ${hasLeak ? 'bg-red-950/50 text-red-500' : 'bg-emerald-950/50 text-emerald-500'}`}>
              {hasLeak ? <ShieldAlert className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Pump Status */}
      <Card className="bg-slate-900 border-slate-700/50 shadow-xl overflow-hidden relative group">
        <div className={`absolute top-0 left-0 w-1 h-full ${pumpState ? 'bg-cyan-500' : 'bg-slate-500'}`} />
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">PUMP STATUS</p>
              <h3 className={`text-2xl font-bold mt-1 ${pumpState ? 'text-cyan-400' : 'text-slate-300'}`}>
                {pumpState ? 'ON' : 'OFF'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {!pumpState && hasLeak ? 'Automatic Safety' : 'Manual / Automatic'}
              </p>
            </div>
            <div className={`p-3 rounded-xl ${pumpState ? 'bg-cyan-950/50 text-cyan-500' : 'bg-slate-800 text-slate-500'}`}>
              <Power className="w-6 h-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Total Flow */}
      <Card className="bg-slate-900 border-slate-700/50 shadow-xl overflow-hidden relative group">
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">TOTAL FLOW</p>
              <h3 className="text-2xl font-bold mt-1 text-blue-400">
                {totalFlow.toFixed(2)} <span className="text-sm font-normal text-slate-500">L/min</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">Current outlet flow</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-950/50 text-blue-500">
              <Droplets className="w-6 h-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 4: Leak Events */}
      <Card className="bg-slate-900 border-slate-700/50 shadow-xl overflow-hidden relative group">
        <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">LEAK EVENTS</p>
              <h3 className="text-2xl font-bold mt-1 text-orange-400">
                {totalLeaks}
              </h3>
              <p className="text-xs text-slate-500 mt-1">Detected events</p>
            </div>
            <div className="p-3 rounded-xl bg-orange-950/50 text-orange-500">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
