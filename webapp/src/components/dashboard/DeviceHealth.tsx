'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Server, Wifi, Cpu, Database, Droplets, Activity, Cloud, CloudOff } from 'lucide-react';
import { useDevice } from '@/lib/hooks/useDevice';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface DeviceHealthProps {
  deviceId: string;
}

export function DeviceHealth({ deviceId }: DeviceHealthProps) {
  const { device, online, loading } = useDevice(deviceId);
  const [lastSeen, setLastSeen] = useState<string>('');
  const [dbOnline, setDbOnline] = useState<boolean | null>(null);
  const [dbLatency, setDbLatency] = useState<number | null>(null);

  // Check database connectivity
  useEffect(() => {
    const checkDb = async () => {
      try {
        const supabase = createClient();
        const start = performance.now();
        const { error } = await supabase.from('devices').select('id').limit(1);
        const latency = Math.round(performance.now() - start);
        setDbOnline(!error);
        setDbLatency(!error ? latency : null);
      } catch {
        setDbOnline(false);
        setDbLatency(null);
      }
    };

    checkDb();
    const interval = setInterval(checkDb, 30_000);
    return () => clearInterval(interval);
  }, []);

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
          System Status
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {/* Hardware Status Badge */}
        <div className="flex items-center gap-4 mb-4">
          <div className={cn(
            "w-16 h-16 rounded-2xl border flex items-center justify-center shadow-lg",
            online
              ? "bg-gradient-to-br from-emerald-900/50 to-emerald-800/30 border-emerald-600/50"
              : "bg-gradient-to-br from-slate-700 to-slate-800 border-slate-600"
          )}>
            <Cpu className={cn("w-8 h-8", online ? "text-emerald-400" : "text-white")} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-wide">ESP32</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn(
                "relative w-2.5 h-2.5 rounded-full",
                online
                  ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                  : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
              )}>
                {online && (
                  <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-50" />
                )}
              </span>
              <span className={cn("text-sm font-semibold", online ? "text-emerald-400" : "text-red-400")}>
                {online ? 'HARDWARE ONLINE' : 'HARDWARE OFFLINE'}
              </span>
            </div>
          </div>
        </div>

        {/* Database Status Badge */}
        <div className="flex items-center gap-4 mb-6">
          <div className={cn(
            "w-16 h-16 rounded-2xl border flex items-center justify-center shadow-lg",
            dbOnline
              ? "bg-gradient-to-br from-cyan-900/50 to-cyan-800/30 border-cyan-600/50"
              : "bg-gradient-to-br from-slate-700 to-slate-800 border-slate-600"
          )}>
            {dbOnline ? (
              <Cloud className="w-8 h-8 text-cyan-400" />
            ) : (
              <CloudOff className="w-8 h-8 text-slate-400" />
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-wide">Supabase</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn(
                "relative w-2.5 h-2.5 rounded-full",
                dbOnline === null
                  ? "bg-amber-500"
                  : dbOnline
                    ? "bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]"
                    : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
              )}>
                {dbOnline && (
                  <span className="absolute inset-0 rounded-full bg-cyan-500 animate-ping opacity-50" />
                )}
              </span>
              <span className={cn(
                "text-sm font-semibold",
                dbOnline === null ? "text-amber-400" : dbOnline ? "text-cyan-400" : "text-red-400"
              )}>
                {dbOnline === null ? 'CHECKING...' : dbOnline ? 'DATABASE ONLINE' : 'DATABASE OFFLINE'}
              </span>
              {dbLatency !== null && (
                <span className="text-xs text-slate-500 ml-1">({dbLatency}ms)</span>
              )}
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
            label="Database" 
            value={dbOnline === null ? "CHECKING..." : dbOnline ? `CONNECTED (${dbLatency}ms)` : "UNREACHABLE"} 
            status={dbOnline === null ? 'warning' : dbOnline ? 'good' : 'bad'} 
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

