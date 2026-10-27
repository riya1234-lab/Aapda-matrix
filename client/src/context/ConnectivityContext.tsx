import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { getPendingIncidents, removePendingIncident } from '../services/offlineDb';

export interface TransportStatus {
  isInternetReachable: boolean;
  isBrowserOnline: boolean;
  isBleAvailable: boolean;
  isWifiDirectSupported: boolean;
  isCellularAvailable: boolean;
  pendingQueueCount: number;
  isSyncing: boolean;
}

interface ConnectivityContextType extends TransportStatus {
  checkReachability: () => Promise<boolean>;
  triggerManualSync: () => Promise<number>;
}

const ConnectivityContext = createContext<ConnectivityContextType | undefined>(undefined);

export const ConnectivityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isBrowserOnline, setIsBrowserOnline] = useState<boolean>(navigator.onLine);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean>(true);
  const [isBleAvailable] = useState<boolean>('bluetooth' in navigator);
  const [pendingQueueCount, setPendingQueueCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Check actual backend reachability
  const checkReachability = useCallback(async (): Promise<boolean> => {
    if (!navigator.onLine) {
      setIsInternetReachable(false);
      return false;
    }
    const reachable = await api.checkHealth();
    setIsInternetReachable(reachable);
    return reachable;
  }, []);

  // Update pending queue count from IndexedDB
  const refreshPendingCount = useCallback(async () => {
    try {
      const items = await getPendingIncidents();
      setPendingQueueCount(items.length);
    } catch {
      setPendingQueueCount(0);
    }
  }, []);

  // Background sync worker
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

          // If there was an audio recording attached, upload it
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

  useEffect(() => {
    const handleOnline = () => {
      setIsBrowserOnline(true);
      checkReachability().then((reachable) => {
        if (reachable) triggerManualSync();
      });
    };

    const handleOffline = () => {
      setIsBrowserOnline(false);
      setIsInternetReachable(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    checkReachability();
    refreshPendingCount();

    // Periodic reachability probe every 20 seconds
    const interval = setInterval(() => {
      checkReachability().then((reachable) => {
        if (reachable) triggerManualSync();
      });
      refreshPendingCount();
    }, 20000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [checkReachability, refreshPendingCount, triggerManualSync]);

  return (
    <ConnectivityContext.Provider
      value={{
        isInternetReachable,
        isBrowserOnline,
        isBleAvailable,
        isWifiDirectSupported: false, // In browser environment labeled honestly
        isCellularAvailable: 'contacts' in navigator || 'sms' in navigator,
        pendingQueueCount,
        isSyncing,
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
