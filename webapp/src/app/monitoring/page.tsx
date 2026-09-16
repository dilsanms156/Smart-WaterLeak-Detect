'use client';

import { useDevice } from '@/lib/hooks/useDevice';
import { useRealtimeReadings } from '@/lib/hooks/useRealtimeReadings';
import { SensorCard } from '@/components/dashboard/SensorCard';
import { FlowComparison } from '@/components/dashboard/FlowComparison';

const DEVICE_ID = 'water-leak-device-01';

export default function MonitoringPage() {
  const { loading: deviceLoading, device } = useDevice(DEVICE_ID);
  const { latestReading } = useRealtimeReadings(DEVICE_ID);

  const isLoading = deviceLoading && !device;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Live Monitoring</h1>
        <p className="text-slate-400">Real-time sensor flow rates and pipeline visualization.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <SensorCard 
          id="S1" 
          name="Sensor 1 (Inlet)" 
          flow={latestReading?.sensor1_flow} 
          isLoading={isLoading} 
        />
        <SensorCard 
          id="S2" 
          name="Sensor 2 (Zone 1)" 
          flow={latestReading?.sensor2_flow} 
          isLoading={isLoading} 
        />
        <SensorCard 
          id="S3" 
          name="Sensor 3 (Outlet)" 
          flow={latestReading?.sensor3_flow} 
          isLoading={isLoading} 
        />
      </div>

      <div className="w-full pt-4">
        <FlowComparison 
          reading={latestReading} 
          isLoading={isLoading} 
        />
      </div>
      
      <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 text-sm text-slate-400">
        <h4 className="font-semibold text-slate-200 mb-2">How it works</h4>
        <p>
          The pipeline visualization compares flow rates between adjacent sensors. 
          A significant drop between S1 and S2, or S2 and S3, indicates a potential leak in that zone.
          The system will automatically flag sustained drops that exceed the configured threshold.
        </p>
      </div>
    </div>
  );
}
