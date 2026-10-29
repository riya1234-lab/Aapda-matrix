import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import { getPendingIncidents, removePendingIncident } from '../services/offlineDb';

// ─── Connection State ─────────────────────────────────────────────────────────
// These states are mutually exclusive and clearly defined:

export type ConnectionState =
  | 'CHECKING'           // Initial state or re-checking in progress
  | 'ONLINE'             // Backend health endpoint responded successfully
  | 'LIMITED_CONNECTIVITY'  // Browser has network but backend is not reachable
  | 'OFFLINE'            // Browser/device reports no network connection
  | 'SERVER_UNAVAILABLE'; // Backend health check failed despite apparent connectivity

export interface TransportStatus {
  connectionState: ConnectionState;
  // Legacy boolean aliases (kept for backward compatibility with components)
  isInternetReachable: boolean;
  isBrowserOnline: boolean;
  isBleAvailable: boolean;
  isWifiDirectSupported: boolean;
  isCellularAvailable: boolean;
  pendingQueueCount: number;
  isSyncing: boolean;
  lastCheckedAt: Date | null;
}

interface ConnectivityContextType extends TransportStatus {
  checkReachability: () => Promise<boolean>;
  triggerManualSync: () => Promise<number>;
}

const ConnectivityContext = createContext<ConnectivityContextType | undefined>(undefined);

const HEALTH_CHECK_INTERVAL_MS = 30_000; // 30 seconds — not too aggressive
const HEALTH_CHECK_TIMEOUT_MS  = 8_000;  // 8 second timeout per check

export const ConnectivityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Start OFFLINE (not ONLINE) — do not claim connectivity before first health check
  const [connectionState, setConnectionState] = useState<ConnectionState>('CHECKING');
  const [isBrowserOnline, setIsBrowserOnline] = useState<boolean>(navigator.onLine);
  const [pendingQueueCount, setPendingQueueCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);

  // Track in-flight health check to avoid race conditions
  const healthCheckAbortRef = useRef<AbortController | null>(null);

  const isBleAvailable = 'bluetooth' in navigator;

  // ─── Core: Actual backend health check ─────────────────────────────────────
  const checkReachability = useCallback(async (): Promise<boolean> => {
    // If browser is offline, no need to probe
    if (!navigator.onLine) {
      setConnectionState('OFFLINE');
      setIsBrowserOnline(false);
      setLastCheckedAt(new Date());
      return false;
    }

    // Cancel any in-flight health check
    if (healthCheckAbortRef.current) {
      healthCheckAbortRef.current.abort();
    }
    const controller = new AbortController();
    healthCheckAbortRef.current = controller;

    setConnectionState('CHECKING');

    try {
      const reachable = await Promise.race([
        api.checkHealth(),
        new Promise<false>((_, reject) =>
          setTimeout(() => reject(new Error('Health check timeout')), HEALTH_CHECK_TIMEOUT_MS)
        ),
      ]);

      if (controller.signal.aborted) return false;

      if (reachable) {
        setConnectionState('ONLINE');
        setIsBrowserOnline(true);
        setLastCheckedAt(new Date());
        return true;
      } else {
        // Browser is online but backend didn't respond properly
        setConnectionState(navigator.onLine ? 'SERVER_UNAVAILABLE' : 'OFFLINE');
        setLastCheckedAt(new Date());
        return false;
      }
    } catch (err: any) {
      if (controller.signal.aborted) return false;
      // Distinguish: browser offline vs. server unavailable
      setConnectionState(navigator.onLine ? 'SERVER_UNAVAILABLE' : 'OFFLINE');
      setLastCheckedAt(new Date());
      return false;
    }
  }, []);

  // ─── Pending queue count ────────────────────────────────────────────────────
  const refreshPendingCount = useCallback(async () => {
    try {
      const items = await getPendingIncidents();
      setPendingQueueCount(items.length);
    } catch {
      setPendingQueueCount(0);
    }
  }, []);

  // ─── Offline sync worker ────────────────────────────────────────────────────
  const triggerManualSync = useCallback(async (): Promise<number> => {
    const reachable = await checkReachability();
    if (!reachable) return 0;

    setIsSyncing(true);
    let syncedCount = 0;

    try {
      const pending = await getPendingIncidents();
      for (const item of pending) {
        try {
          const res = await api.createIncident({
            ...item.payload,
            communicationMethod: 'INTERNET',
          });

          if (item.audioBlob && res.incident) {
            await api.uploadAudio(res.incident.id, item.audioBlob);
          }

          await removePendingIncident(item.localQueueId);
          syncedCount++;
        } catch (syncErr) {
          console.warn(`Failed to sync queued incident ${item.incidentId}:`, syncErr);
        }
      }
    } finally {
      setIsSyncing(false);
      await refreshPendingCount();
    }

    return syncedCount;
  }, [checkReachability, refreshPendingCount]);

  // ─── Browser network event listeners ───────────────────────────────────────
  useEffect(() => {
    const handleOnline = () => {
      setIsBrowserOnline(true);
      // Browser says we're back — verify with a real health check
      checkReachability().then((reachable) => {
        if (reachable) triggerManualSync();
      });
    };

    const handleOffline = () => {
      setIsBrowserOnline(false);
      setConnectionState('OFFLINE');
    };

    // Page visibility: re-check when user returns to the tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkReachability();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initial check on mount
    checkReachability();
    refreshPendingCount();

    // Periodic probe — controlled interval with abort-on-race protection
    const interval = setInterval(() => {
      checkReachability().then((reachable) => {
        if (reachable) triggerManualSync();
      });
      refreshPendingCount();
    }, HEALTH_CHECK_INTERVAL_MS);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
      if (healthCheckAbortRef.current) {
        healthCheckAbortRef.current.abort();
      }
    };
  }, [checkReachability, refreshPendingCount, triggerManualSync]);

  // Derive boolean alias for backward compatibility
  const isInternetReachable = connectionState === 'ONLINE';

  return (
    <ConnectivityContext.Provider
      value={{
        connectionState,
        isInternetReachable,
        isBrowserOnline,
        isBleAvailable,
        isWifiDirectSupported: false,
        isCellularAvailable: 'contacts' in navigator || 'sms' in navigator,
        pendingQueueCount,
        isSyncing,
        lastCheckedAt,
        checkReachability,
        triggerManualSync,
      }}
    >
      {children}
    </ConnectivityContext.Provider>
  );
};

export const useConnectivity = () => {
  const context = useContext(ConnectivityContext);
  if (!context) throw new Error('useConnectivity must be used within a ConnectivityProvider');
  return context;
};
