'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { LeakEvent } from '@/types';

export function useRealtimeLeaks(deviceId: string) {
  const [activeLeaks, setActiveLeaks] = useState<LeakEvent[]>([]);
  const [recentLeaks, setRecentLeaks] = useState<LeakEvent[]>([]);

  const fetchLeaks = useCallback(async () => {
    const supabase = createClient();

    const { data: active } = await supabase
      .from('leak_events')
      .select('*')
      .eq('device_id', deviceId)
      .eq('status', 'active')
      .order('started_at', { ascending: false });

    if (active) setActiveLeaks(active as LeakEvent[]);

    const { data: recent } = await supabase
      .from('leak_events')
      .select('*')
      .eq('device_id', deviceId)
      .order('started_at', { ascending: false })
      .limit(20);

    if (recent) setRecentLeaks(recent as LeakEvent[]);
  }, [deviceId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLeaks();

    const supabase = createClient();
    const channelName = `leak-events-${deviceId}`;

    const existing = supabase.getChannels().find(
      (ch) => ch.topic === `realtime:${channelName}`
    );
    if (existing) {
      supabase.removeChannel(existing);
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leak_events',
          filter: `device_id=eq.${deviceId}`,
        },
        () => {
          fetchLeaks();
        }
      );

    channel.subscribe((status) => {
      if (status !== 'SUBSCRIBED') {
        console.log(`Realtime unavailable for ${channelName}:`, status);
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [deviceId, fetchLeaks]);

  return { activeLeaks, recentLeaks, hasActiveLeak: activeLeaks.length > 0 };
}
