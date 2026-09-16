'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { PumpEvent } from '@/types';

export function useRealtimePump(deviceId: string) {
  const [pumpEvents, setPumpEvents] = useState<PumpEvent[]>([]);
  const [currentPumpState, setCurrentPumpState] = useState<boolean>(false);

  const fetchPumpEvents = useCallback(async () => {
    const supabase = createClient();

    const { data } = await supabase
      .from('pump_events')
      .select('*')
      .eq('device_id', deviceId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      setPumpEvents(data as PumpEvent[]);
      if (data.length > 0) {
        setCurrentPumpState((data[0] as PumpEvent).new_state);
      }
    }
  }, [deviceId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPumpEvents();

    const supabase = createClient();
    const channelName = `pump-events-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pump_events',
          filter: `device_id=eq.${deviceId}`,
        },
        (payload) => {
          const newEvent = payload.new as PumpEvent;
          setPumpEvents((prev) => [newEvent, ...prev].slice(0, 50));
          setCurrentPumpState(newEvent.new_state);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [deviceId, fetchPumpEvents]);

  return { pumpEvents, currentPumpState };
}
