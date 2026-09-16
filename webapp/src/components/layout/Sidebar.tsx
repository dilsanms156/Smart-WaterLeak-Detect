'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

import { useDevice } from '@/lib/hooks/useDevice';

const navItems = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/monitoring', label: 'Live Monitoring', icon: '📡' },
  { href: '/history', label: 'History', icon: '📈' },
  { href: '/leaks', label: 'Leak Events', icon: '💧' },
  { href: '/pump', label: 'Pump Control', icon: '⚙️' },
  { href: '/settings', label: 'Settings', icon: '🔧' },
];

const DEVICE_ID = 'water-leak-device-01';

export function Sidebar() {
  const pathname = usePathname();
  const { online } = useDevice(DEVICE_ID);

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-slate-900 border-r border-slate-700/50 min-h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-cyan-500/25">
            💧🛡️
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide">SMART WATER</h1>
            <p className="text-xs font-semibold text-cyan-400">LEAK GUARD</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-400 border border-cyan-500/30 shadow-lg shadow-cyan-500/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              )}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700/50 bg-slate-900/50">
        <div className="flex flex-col gap-1">
          <div className="text-xs text-slate-500 font-medium">Device</div>
          <div className="text-sm font-semibold text-white">WATER-01</div>
          <div className="flex items-center gap-2 mt-1">
            <div className={cn(
              "w-2 h-2 rounded-full",
              online ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
            )} />
            <span className={cn("text-xs font-bold", online ? "text-emerald-400" : "text-red-400")}>
              {online ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
