'use client';

import { Bell } from 'lucide-react';
import { useDevice } from '@/lib/hooks/useDevice';
import { formatTimestamp, cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

const DEVICE_ID = 'water-leak-device-01';

export function Header() {
  const { device, online } = useDevice(DEVICE_ID);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    if (!device?.last_seen) return;
    
    const updateTime = () => {
      const now = new Date();
      const last = new Date(device.last_seen!);
      const diffSeconds = Math.floor((now.getTime() - last.getTime()) / 1000);
      
      if (diffSeconds < 60) {
        setLastUpdated(`${diffSeconds} seconds ago`);
      } else if (diffSeconds < 3600) {
        setLastUpdated(`${Math.floor(diffSeconds / 60)} minutes ago`);
      } else {
        setLastUpdated(formatTimestamp(device.last_seen));
      }
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [device?.last_seen]);

  return (
    <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left: Title + device info (mobile logo) */}
        <div className="flex items-center gap-4">
          {/* Mobile logo */}
          <div className="lg:hidden w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-cyan-500/25">
            💧🛡️
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Smart Water Leakage Detection
            </h2>
            <div className="text-sm text-slate-400 mt-1">
              Real-time water flow monitoring & automatic pump protection
            </div>
          </div>
        </div>

        {/* Right: Connection status + notifications */}
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-4 text-sm bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-700/50">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'w-2.5 h-2.5 rounded-full',
                  online
                    ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                    : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                )}
              />
              <span className={cn("font-semibold", online ? "text-emerald-400" : "text-red-400")}>
                {online ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
            
            <span className="text-slate-600">|</span>
            
            <span className="text-slate-400">
              Last updated: {lastUpdated || 'Waiting...'}
            </span>
          </div>
          
          <button className="p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors border border-transparent hover:border-slate-600 relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-cyan-500 rounded-full border border-slate-900"></span>
          </button>
        </div>
      </div>
    </header>
  );
}
