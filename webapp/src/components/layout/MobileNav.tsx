'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/monitoring', label: 'Monitor', icon: '📡' },
  { href: '/history', label: 'History', icon: '📈' },
  { href: '/leaks', label: 'Leaks', icon: '💧' },
  { href: '/pump', label: 'Pump', icon: '⚙️' },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/50 px-2 pb-safe">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium transition-all',
                isActive
                  ? 'text-cyan-400'
                  : 'text-slate-500 hover:text-slate-300'
              )}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
