'use client';

import { useDevice } from '@/lib/hooks/useDevice';
import { useRealtimeReadings } from '@/lib/hooks/useRealtimeReadings';
import { useRealtimeLeaks } from '@/lib/hooks/useRealtimeLeaks';
import { useRealtimePump } from '@/lib/hooks/useRealtimePump';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { PipelineVisualization } from '@/components/dashboard/PipelineVisualization';
import { LiveFlowChart } from '@/components/dashboard/LiveFlowChart';
import { RecentLeakEvents } from '@/components/dashboard/RecentLeakEvents';
import { DeviceHealth } from '@/components/dashboard/DeviceHealth';
import { PumpControl } from '@/components/dashboard/PumpControl';
import { AlertTriangle } from 'lucide-react';

const DEVICE_ID = 'water-leak-device-01';

export default function DashboardPage() {
  const { device, loading: deviceLoading, online } = useDevice(DEVICE_ID);
  const { latestReading } = useRealtimeReadings(DEVICE_ID);
  const { activeLeaks, hasActiveLeak, recentLeaks } = useRealtimeLeaks(DEVICE_ID);
  const { currentPumpState } = useRealtimePump(DEVICE_ID);

  const isLoading = deviceLoading && !device;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Leak Alert Banner */}
      {hasActiveLeak && (
        <div className="w-full bg-red-950/80 border-2 border-red-500 rounded-xl p-4 sm:p-6 shadow-[0_0_30px_rgba(239,68,68,0.3)] animate-pulse">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500 rounded-xl shrink-0 text-white shadow-lg">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-red-400 uppercase tracking-widest">Leak Detected</h2>
                <div className="text-red-200/90 font-medium mt-1">
                  Location: <span className="text-white bg-red-900/50 px-2 py-0.5 rounded ml-1">{activeLeaks[0]?.location}</span>
                </div>
              </div>
            </div>
            <div className="w-full sm:w-auto bg-red-900/50 border border-red-500/30 rounded-lg p-3 text-center">
              <div className="text-xs text-red-300 font-bold uppercase mb-1">Automatic Pump Status</div>
              <div className="text-sm font-black text-white">STOPPED</div>
            </div>
          </div>
        </div>
      )}

      {/* 4 Summary Cards */}
      <SummaryCards 
        hasLeak={hasActiveLeak}
        pumpState={currentPumpState}
        reading={latestReading}
        totalLeaks={recentLeaks.length}
      />

      {/* Pipeline Visualization */}
      <div className="w-full">
        <PipelineVisualization 
          reading={latestReading}
          activeLeaks={activeLeaks}
          isLoading={isLoading}
        />
      </div>

      {/* Flow Chart and Recent Leaks row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2">
          <LiveFlowChart deviceId={DEVICE_ID} />
        </div>
        <div className="lg:col-span-1 flex flex-col gap-4 sm:gap-6">
          <DeviceHealth deviceId={DEVICE_ID} />
          <RecentLeakEvents 
            recentLeaks={recentLeaks}
            isLoading={isLoading}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <PumpControl 
          deviceId={DEVICE_ID} 
          pumpState={currentPumpState} 
          hasLeak={hasActiveLeak}
          isOnline={online}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
