'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Server, Wifi, Cpu, Database, Droplets, Activity } from 'lucide-react';
import { useDevice } from '@/lib/hooks/useDevice';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface DeviceHealthProps {
  deviceId: string;
}

export function DeviceHealth({ deviceId }: DeviceHealthProps) {
  const { device, online, loading } = useDevice(deviceId);
  const [lastSeen, setLastSeen] = useState<string>('');

  useEffect(() => {
    if (!device?.last_seen) return;
    
    const updateTime = () => {
      const now = new Date();
      const last = new Date(device.last_seen!);
      const diffSeconds = Math.floor((now.getTime() - last.getTime()) / 1000);
      
      if (diffSeconds < 60) setLastSeen(`${diffSeconds} seconds ago`);
      else if (diffSeconds < 3600) setLastSeen(`${Math.floor(diffSeconds / 60)} minutes ago`);
      else setLastSeen('Over an hour ago');
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [device?.last_seen]);

  if (loading) {
    return (
      <Card className="shadow-xl bg-slate-900 border-slate-700/50">
        <CardContent className="h-64 flex items-center justify-center">
          <Activity className="w-8 h-8 text-slate-600 animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl bg-slate-900 border-slate-700/50">
      <CardHeader className="border-b border-slate-700/50 bg-slate-800/30 pb-4">
        <CardTitle className="text-lg font-bold flex items-center gap-2 text-white">
          <Server className="w-5 h-5 text-slate-400" />
          Device Health
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 flex items-center justify-center shadow-lg">
            <Cpu className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-wide">ESP32</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn("w-2.5 h-2.5 rounded-full", online ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]")} />
              <span className={cn("text-sm font-semibold", online ? "text-emerald-400" : "text-red-400")}>
                {online ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
        <HealthRow 
            icon={<Activity className="w-4 h-4" />} 
            label="Last Seen" 
            value={online ? lastSeen : (device?.last_seen ? new Date(device.last_seen!).toLocaleString() : 'Never')} 
            status={online ? 'good' : 'bad'} 
          />
          <HealthRow 
            icon={<Wifi className="w-4 h-4" />} 
            label="Wi-Fi" 
            value={online ? "CONNECTED" : "DISCONNECTED"} 
            status={online ? 'good' : 'bad'} 
          />
          <HealthRow 
            icon={<Droplets className="w-4 h-4" />} 
            label="Sensors" 
            value={online ? "3 / 3 ACTIVE" : "UNKNOWN"} 
            status={online ? 'good' : 'warning'} 
          />
          <HealthRow 
            icon={<Server className="w-4 h-4" />} 
            label="Pump" 
            value={online ? "READY" : "UNREACHABLE"} 
            status={online ? 'good' : 'warning'} 
          />
          <HealthRow 
            icon={<Database className="w-4 h-4" />} 
            label="Backend" 
            value="CONNECTED" 
            status="good" 
          />
        </div>
      </CardContent>
    </Card>
  );
}

function HealthRow({ icon, label, value, status }: { icon: React.ReactNode, label: string, value: string, status: 'good' | 'warning' | 'bad' }) {
  let color = "text-slate-400";
  if (status === 'good') color = "text-emerald-400";
  if (status === 'warning') color = "text-amber-400";
  if (status === 'bad') color = "text-red-400";

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
      <div className="flex items-center gap-3 text-slate-300">
        <div className="text-slate-500">{icon}</div>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className={cn("text-sm font-bold", color)}>
        {value}
      </div>
    </div>
  );
}
