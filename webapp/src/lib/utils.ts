// =============================================================================
// Utility Functions
// =============================================================================

import { TimePeriod } from '@/types';

/** Convert a TimePeriod label to a Date in the past */
export function getTimeRangeStart(period: TimePeriod): Date {
  const now = new Date();
  switch (period) {
    case '1h':
      return new Date(now.getTime() - 60 * 60 * 1000);
    case '6h':
      return new Date(now.getTime() - 6 * 60 * 60 * 1000);
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 60 * 60 * 1000);
  }
}

/** Format a timestamp string for display */
export function formatTimestamp(ts: string | null): string {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

/** Format a duration between two timestamps */
export function formatDuration(start: string, end: string | null): string {
  if (!end) return 'Ongoing';
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

/** Format flow rate with units */
export function formatFlow(flow: number): string {
  return `${flow.toFixed(2)} L/min`;
}

/** Determine if a device is considered online based on last_seen */
export function isDeviceOnline(lastSeen: string | null): boolean {
  if (!lastSeen) return false;
  const diff = Date.now() - new Date(lastSeen).getTime();
  return diff < 60_000; // Online if seen within the last 60 seconds
}

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Classnames helper — joins and merges tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
