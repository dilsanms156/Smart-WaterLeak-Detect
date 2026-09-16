'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Device } from '@/types';
import { isDeviceOnline } from '@/lib/utils';

export function useDevice(deviceId: string) {
  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDevice = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('devices')
      .select('*')
      .eq('device_id', deviceId)
      .maybeSingle();

    if (data) setDevice(data as Device);
    setLoading(false);
  }, [deviceId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDevice();

    const supabase = createClient();
    const channelName = `device-${deviceId}`;

    // Remove any existing channel with the same name first
    // (handles React Strict Mode double-mount with singleton client)
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
          table: 'devices',
          filter: `device_id=eq.${deviceId}`,
        },
        (payload) => {
          if (payload.new) setDevice(payload.new as Device);
        }
      );

    channel.subscribe((status) => {
      if (status !== 'SUBSCRIBED') {
        console.log(`Realtime unavailable for ${channelName}:`, status);
      }
    });

    // Also refresh periodically to update online status
    const interval = setInterval(fetchDevice, 30_000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [deviceId, fetchDevice]);

  const online = device ? isDeviceOnline(device.last_seen) : false;

  return { device, loading, online };
}
