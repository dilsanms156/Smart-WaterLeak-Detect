'use client';

import { useDevice } from '@/lib/hooks/useDevice';
import { useRealtimePump } from '@/lib/hooks/useRealtimePump';
import { useRealtimeLeaks } from '@/lib/hooks/useRealtimeLeaks';
import { PumpControl } from '@/components/dashboard/PumpControl';
import { PumpHistory } from '@/components/tables/PumpHistory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

const DEVICE_ID = 'water-leak-device-01';

export default function PumpPage() {
  const { device, loading: deviceLoading, online } = useDevice(DEVICE_ID);
  const { pumpEvents, currentPumpState } = useRealtimePump(DEVICE_ID);
  const { hasActiveLeak } = useRealtimeLeaks(DEVICE_ID);

  const isLoading = deviceLoading && !device;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Pump Control & History</h1>
        <p className="text-slate-400">Manually override the pump and view the event log.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <PumpControl 
            deviceId={DEVICE_ID} 
            pumpState={currentPumpState} 
            hasLeak={hasActiveLeak}
            isOnline={online}
            isLoading={isLoading}
          />
        </div>

        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Pump Event Log</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <PumpHistory events={pumpEvents} isLoading={isLoading} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
