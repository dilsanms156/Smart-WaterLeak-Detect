'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { Power, PowerOff } from 'lucide-react';

interface PumpControlProps {
  deviceId: string;
  pumpState: boolean;
  hasLeak: boolean;
  isOnline: boolean;
  isLoading: boolean;
}

export function PumpControl({ deviceId, pumpState, hasLeak, isOnline, isLoading }: PumpControlProps) {
  const [isCommanding, setIsCommanding] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingCommand, setPendingCommand] = useState<'ON' | 'OFF' | null>(null);
  const [commandStatus, setCommandStatus] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCommand = async (command: 'ON' | 'OFF') => {
    setIsCommanding(true);
    setCommandStatus('Command sent');
    
    try {
      const res = await fetch('/api/pump', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, command }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setCommandStatus('Rejected');
        throw new Error(data.error || 'Failed to send command');
      }
      
      setCommandStatus('Waiting for ESP32');
      
      toast({
        title: 'Command Sent',
        description: `Pump ${command} command queued. Waiting for ESP32...`,
        type: 'success'
      });
      
      // Auto-clear status after 10s if not updated via realtime
      setTimeout(() => setCommandStatus(null), 10000);
      
    } catch (err) {
      toast({
        title: 'Command Failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        type: 'error'
      });
      // Leave rejected status briefly
      setTimeout(() => setCommandStatus(null), 5000);
    } finally {
      setIsCommanding(false);
      setConfirmOpen(false);
      setPendingCommand(null);
    }
  };

  const requestCommand = (cmd: 'ON' | 'OFF') => {
    if (cmd === 'ON' && hasLeak) {
      toast({
        title: 'Action Blocked',
        description: 'Cannot turn pump on while a leak is active.',
        type: 'error'
      });
      return;
    }
    
    setPendingCommand(cmd);
    setConfirmOpen(true);
  };

  if (isLoading) {
    return <div className="h-64 bg-slate-800 animate-pulse rounded-xl" />;
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-4 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Power className="w-5 h-5 text-cyan-500" />
              Pump Control
            </CardTitle>
            <div className={`px-3 py-1 text-xs font-bold rounded-full ${pumpState ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
              STATUS: {pumpState ? 'ON' : 'OFF'}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <Button 
              size="lg" 
              variant="default"
              className="h-20 text-lg shadow-lg shadow-cyan-500/20"
              disabled={!isOnline || isCommanding || hasLeak}
              onClick={() => requestCommand('ON')}
            >
              <Power className="mr-2 h-6 w-6" />
              TURN ON
            </Button>
            <Button 
              size="lg" 
              variant="destructive"
              className="h-20 text-lg shadow-lg shadow-red-500/20"
              disabled={!isOnline || isCommanding}
              onClick={() => requestCommand('OFF')}
            >
              <PowerOff className="mr-2 h-6 w-6" />
              TURN OFF
            </Button>
          </div>
          
          <div className="mt-6 text-sm">
            {commandStatus && (
              <p className="text-cyan-400 text-center font-semibold mb-2 py-1 bg-cyan-950/30 rounded">
                Status: {commandStatus}
              </p>
            )}
            
            {!isOnline && (
              <p className="text-amber-400 text-center bg-amber-500/10 py-2 rounded-lg">
                Device is offline. Commands cannot be sent.
              </p>
            )}
            {isOnline && hasLeak && (
              <p className="text-red-400 text-center bg-red-500/10 py-2 rounded-lg font-semibold flex items-center justify-center gap-2">
                <span className="text-lg">⚠</span> Pump start blocked. Leak detected between S1 and S2.
              </p>
            )}
            {isOnline && !hasLeak && !commandStatus && (
              <p className="text-slate-400 text-center">
                Select an action to manually override pump state.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog 
        isOpen={confirmOpen}
        title={`Turn Pump ${pendingCommand}`}
        description={
          pendingCommand === 'ON' 
            ? "Are you sure you want to turn the pump ON? Ensure the system is safe to pressurize." 
            : "Are you sure you want to turn the pump OFF? Water flow will stop."
        }
        confirmText={`Yes, Turn ${pendingCommand}`}
        isDestructive={pendingCommand === 'OFF'}
        onConfirm={() => pendingCommand && handleCommand(pendingCommand)}
        onCancel={() => {
          setConfirmOpen(false);
          setPendingCommand(null);
        }}
      />
    </>
  );
}
