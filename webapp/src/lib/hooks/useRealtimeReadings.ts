'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { SensorReading } from '@/types';

export function useRealtimeReadings(deviceId: string) {
  const [latestReading, setLatestReading] = useState<SensorReading | null>(null);

  const fetchLatest = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('sensor_readings')
      .select('*')
      .eq('device_id', deviceId)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) setLatestReading(data as SensorReading);
  }, [deviceId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLatest();

    const supabase = createClient();
    const channelName = `sensor-readings-${deviceId}`;

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
          event: 'INSERT',
          schema: 'public',
          table: 'sensor_readings',
          filter: `device_id=eq.${deviceId}`,
        },
        (payload) => {
          setLatestReading(payload.new as SensorReading);
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
  }, [deviceId, fetchLatest]);

  return { latestReading };
}
