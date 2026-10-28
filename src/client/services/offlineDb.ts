import Dexie, { Table } from 'dexie';
import { Incident, EmergencyContact, QueuedOfflineIncident, PersonalEmergencyContact } from '../types';

export class AapdaMatrixDatabase extends Dexie {
  pendingIncidents!: Table<QueuedOfflineIncident, string>;
  cachedIncidents!: Table<Incident, string>;
  cachedContacts!: Table<EmergencyContact, string>;
  personalContacts!: Table<PersonalEmergencyContact, string>;

  constructor() {
    super('AapdaMatrixDB');
    this.version(2).stores({
      pendingIncidents: 'localQueueId, incidentId, createdAt, retryCount',
      cachedIncidents: 'id, emergencyCategory, priority, status, createdAt',
      cachedContacts: 'id, category, priorityOrder',
      personalContacts: 'id, name, phone, notifyOnLowBattery, createdAt',
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

// Personal Predefined Emergency Contacts Operations
export async function getPersonalContacts(): Promise<PersonalEmergencyContact[]> {
  try {
    const list = await offlineDb.personalContacts.toArray();
    if (list.length === 0) {
      // Seed initial default personal contacts for immediate testing
      const initial: PersonalEmergencyContact[] = [
        {
          id: 'contact_p1',
          name: 'Primary Family (Mother)',
          phone: '+91-9899112299',
          relationship: 'Parent / Family',
          notifyOnLowBattery: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'contact_p2',
          name: 'Dr. Sameer (Family Physician)',
          phone: '+91-9811002233',
          relationship: 'Doctor',
          notifyOnLowBattery: false,
          createdAt: new Date().toISOString(),
        },
      ];
      await offlineDb.personalContacts.bulkPut(initial);
      return initial;
    }
    return list;
  } catch {
    return [];
  }
}

export async function savePersonalContact(contact: PersonalEmergencyContact): Promise<void> {
  await offlineDb.personalContacts.put(contact);
}

export async function deletePersonalContact(id: string): Promise<void> {
  await offlineDb.personalContacts.delete(id);
}
