import Dexie, { Table } from 'dexie';
import { Incident, EmergencyContact, QueuedOfflineIncident } from '../types';

export class AapdaMatrixDatabase extends Dexie {
  pendingIncidents!: Table<QueuedOfflineIncident, string>;
  cachedIncidents!: Table<Incident, string>;
  cachedContacts!: Table<EmergencyContact, string>;

  constructor() {
    super('AapdaMatrixDB');
    this.version(1).stores({
      pendingIncidents: 'localQueueId, incidentId, createdAt, retryCount',
      cachedIncidents: 'id, emergencyCategory, priority, status, createdAt',
      cachedContacts: 'id, category, priorityOrder',
    });
  }
}

export const offlineDb = new AapdaMatrixDatabase();

export async function queueOfflineIncident(incidentData: any, audioBlob?: Blob): Promise<string> {
  const localQueueId = `QUEUE_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const incidentId = incidentData.id || `SOS_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const queuedItem: QueuedOfflineIncident = {
    localQueueId,
    incidentId,
    payload: {
      ...incidentData,
      id: incidentId,
      communicationMethod: 'LOCAL_OFFLINE',
      deliveryStatus: 'QUEUED',
    },
    audioBlob,
    createdAt: Date.now(),
    retryCount: 0,
  };

  await offlineDb.pendingIncidents.put(queuedItem);

  // Also cache locally for immediate UI display
  const localIncident: Incident = {
    ...queuedItem.payload,
    status: 'PENDING',
    deliveryStatus: 'QUEUED',
    acknowledgementReceived: false,
    hopCount: 0,
    createdAt: new Date().toISOString(),
  };
  await offlineDb.cachedIncidents.put(localIncident);

  return incidentId;
}

export async function getPendingIncidents(): Promise<QueuedOfflineIncident[]> {
  return offlineDb.pendingIncidents.toArray();
}

export async function removePendingIncident(localQueueId: string): Promise<void> {
  await offlineDb.pendingIncidents.delete(localQueueId);
}

export async function cacheEmergencyContacts(contacts: EmergencyContact[]): Promise<void> {
  await offlineDb.cachedContacts.clear();
  await offlineDb.cachedContacts.bulkPut(contacts);
}

export async function getCachedEmergencyContacts(): Promise<EmergencyContact[]> {
  return offlineDb.cachedContacts.orderBy('priorityOrder').toArray();
}
