import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Incident, CreateIncidentPayload } from '../types';
import { api } from '../services/api';
import { queueOfflineIncident, offlineDb } from '../services/offlineDb';
import { getSocket } from '../services/socket';
import { useConnectivity } from './ConnectivityContext';

interface IncidentContextType {
  incidents: Incident[];
  activeIncident: Incident | null;
  isLoading: boolean;
  createIncident: (payload: CreateIncidentPayload) => Promise<{ incidentId: string; deliveredOnline: boolean }>;
  fetchIncidents: () => Promise<void>;
  setActiveIncident: (incident: Incident | null) => void;
}

const IncidentContext = createContext<IncidentContextType | undefined>(undefined);

export const IncidentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [activeIncident, setActiveIncident] = useState<Incident | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { isInternetReachable } = useConnectivity();

  const fetchIncidents = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isInternetReachable) {
        const res = await api.getIncidents();
        setIncidents(res.incidents);
        // Cache in IndexedDB for offline viewing
        await offlineDb.cachedIncidents.bulkPut(res.incidents);
      } else {
        const cached = await offlineDb.cachedIncidents.orderBy('createdAt').reverse().toArray();
        setIncidents(cached);
      }
    } catch {
      const cached = await offlineDb.cachedIncidents.orderBy('createdAt').reverse().toArray();
      setIncidents(cached);
    } finally {
      setIsLoading(false);
    }
  }, [isInternetReachable]);

  const createIncident = async (
    payload: CreateIncidentPayload
  ): Promise<{ incidentId: string; deliveredOnline: boolean }> => {
    const generatedId = payload.id || `SOS_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Attempt online delivery if reachable
    if (isInternetReachable) {
      try {
        const res = await api.createIncident({
          ...payload,
          id: generatedId,
          communicationMethod: 'INTERNET',
        });

        const created = res.incident;

        // If audio blob is present, upload immediately
        if (payload.audioBlob && created) {
          try {
            await api.uploadAudio(created.id, payload.audioBlob);
          } catch (audioErr) {
            console.warn('Audio upload deferred:', audioErr);
          }
        }

        setActiveIncident(created);
        setIncidents((prev) => [created, ...prev.filter((i) => i.id !== created.id)]);
        await offlineDb.cachedIncidents.put(created);

        return { incidentId: created.id, deliveredOnline: true };
      } catch (err) {
        console.warn('Online delivery failed, falling back to IndexedDB persistent queue:', err);
      }
    }

    // Offline Fallback
    const offlineId = await queueOfflineIncident(
      {
        ...payload,
        id: generatedId,
      },
      payload.audioBlob
    );

    const queuedIncident: Incident = {
      id: offlineId,
      emergencyCategory: payload.emergencyCategory,
      disasterSubtype: payload.disasterSubtype || null,
      priority: payload.priority || 'HIGH',
      description: payload.description || 'Distress SOS (Queued Offline)',
      latitude: payload.latitude || null,
      longitude: payload.longitude || null,
      locationAccuracy: payload.locationAccuracy || null,
      locationProtocol: payload.locationProtocol || 'GPS',
      batteryLevel: payload.batteryLevel || null,
      status: 'PENDING',
      communicationMethod: 'LOCAL_OFFLINE',
      deliveryStatus: 'QUEUED',
      acknowledgementReceived: false,
      hopCount: 0,
      createdAt: new Date().toISOString(),
    };

    setActiveIncident(queuedIncident);
    setIncidents((prev) => [queuedIncident, ...prev]);

    return { incidentId: offlineId, deliveredOnline: false };
  };

  useEffect(() => {
    fetchIncidents();

    // Subscribe to real-time Socket.IO broadcasts
    const socket = getSocket();

    const handleNew = (newInc: Incident) => {
      setIncidents((prev) => [newInc, ...prev.filter((i) => i.id !== newInc.id)]);
    };

    const handleUpdated = (updated: Incident) => {
      setIncidents((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      setActiveIncident((current) => (current && current.id === updated.id ? updated : current));
    };

    socket.on('incident:new', handleNew);
    socket.on('incident:updated', handleUpdated);

    return () => {
      socket.off('incident:new', handleNew);
      socket.off('incident:updated', handleUpdated);
    };
  }, [fetchIncidents]);

  return (
    <IncidentContext.Provider
      value={{
        incidents,
        activeIncident,
        isLoading,
        createIncident,
        fetchIncidents,
        setActiveIncident,
      }}
    >
      {children}
    </IncidentContext.Provider>
  );
};

export const useIncident = () => {
  const context = useContext(IncidentContext);
  if (!context) throw new Error('useIncident must be used within an IncidentProvider');
  return context;
};
