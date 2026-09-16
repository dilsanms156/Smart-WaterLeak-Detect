'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatTimestamp } from '@/lib/utils';
import type { Device } from '@/types';

export default function SettingsPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const fetchDevices = async () => {
      try {
        const res = await fetch('/api/devices');
        const json = await res.json();
        
        if (res.ok && isMounted) {
          setDevices(json.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch devices', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchDevices();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Device Settings</h1>
        <p className="text-slate-400">Manage registered devices and view connection details.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registered Devices</CardTitle>
          <CardDescription>
            Devices that have authenticated with the backend API.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="h-16 bg-slate-800 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : devices.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              No devices registered yet.
            </div>
          ) : (
            <div className="space-y-4">
              {devices.map(device => (
                <div key={device.id} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-semibold text-white">{device.name}</h4>
                      <Badge variant={device.status === 'online' ? 'success' : 'secondary'}>
                        {device.status}
                      </Badge>
                    </div>
                    <div className="text-xs font-mono text-slate-500">
                      ID: {device.device_id}
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    <p className="mb-1">Last seen:</p>
                    <p className="text-slate-300 font-medium">{formatTimestamp(device.last_seen)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
          <CardDescription>
            Configuration required for the ESP32 firmware.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 font-mono text-sm space-y-4 text-slate-300">
            <div>
              <span className="text-cyan-400 mr-2">SERVER_URL:</span>
              <span>(Set to your deployment URL)</span>
            </div>
            <div>
              <span className="text-cyan-400 mr-2">DEVICE_API_TOKEN:</span>
              <span>(Matches the env var on the server)</span>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-500">
              Note: The token is not displayed here for security reasons. Check your server&apos;s .env file.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
