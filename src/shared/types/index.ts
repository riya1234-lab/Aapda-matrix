// AAPDA MATRIX - Shared TypeScript Interfaces & Types

export type EmergencyCategory =
  | 'WOMEN_SAFETY'
  | 'NATURAL_DISASTER'
  | 'MEDICAL_EMERGENCY'
  | 'ROAD_ACCIDENT'
  | 'FIRE_EMERGENCY'
  | 'PERSONAL_SAFETY'
  | 'POLICE_ASSISTANCE'
  | 'DISASTER_EMERGENCY'
  | 'OTHER';

export type DisasterType =
  | 'FLOOD'
  | 'EARTHQUAKE'
  | 'LANDSLIDE'
  | 'CYCLONE'
  | 'FIRE'
  | 'BUILDING_COLLAPSE'
  | 'INDUSTRIAL_ACCIDENT'
  | 'EXTREME_WEATHER'
  | 'OTHER';

export type Priority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type IncidentStatus =
  | 'LOCAL_PENDING'
  | 'RECEIVED'
  | 'TRIAGE_PENDING'
  | 'VERIFIED'
  | 'DISPATCH_PENDING'
  | 'IN_ACTION'
  | 'PENDING'
  | 'ACKNOWLEDGED'
  | 'DISPATCHED'
  | 'EN_ROUTE'
  | 'ON_SCENE'
  | 'RESOLVED'
  | 'CANCELLED';

export type CommunicationMethod =
  | 'INTERNET'
  | 'BLE_MESH'
  | 'WIFI_DIRECT'
  | 'SMS'
  | 'LOCAL_OFFLINE';

export type DeliveryStatus =
  | 'LOCAL_PENDING'
  | 'SYNCING'
  | 'QUEUED'
  | 'TRANSMITTING'
  | 'DELIVERED_SERVER'
  | 'ACKNOWLEDGED'
  | 'SYNC_FAILED';

export type UserRole = 'CITIZEN' | 'OPERATOR' | 'COMMANDER';

export interface LocationCoordinates {
  latitude: number | null;
  longitude: number | null;
  accuracy?: number | null;
  timestamp?: number;
  protocol?: string; // 'GPS' | 'NETWORK (IP)' | 'MANUAL' | 'UNAVAILABLE'
  locationStatus?: 'GPS_VERIFIED' | 'LOCATION_UNAVAILABLE' | 'USER_PROVIDED';
  locationSource?: 'GPS' | 'NETWORK' | 'USER_MANUAL' | 'UNAVAILABLE';
}

export interface IncidentAttachment {
  id: string;
  incidentId: string;
  attachmentType: 'AUDIO_VOICE' | 'IMAGE' | 'TELEMETRY';
  secureStorageReference: string;
  mimeType: string;
  fileSize: number;
  durationSeconds?: number;
  createdAt: string;
}

export interface IncidentHistoryItem {
  id: string;
  incidentId: string;
  previousStatus: IncidentStatus;
  newStatus: IncidentStatus;
  changedBy: string;
  timestamp: string;
  notes?: string;
}

export interface ResponseTeam {
  id: string;
  teamName: string;
  serviceType: 'SAR' | 'MEDICAL' | 'FIRE' | 'POLICE' | 'CIVIL_DEFENSE' | string;
  availabilityStatus: 'AVAILABLE' | 'DEPLOYED' | 'RESTING' | string;
  assignedIncidentId?: string | null;
  contactNumber?: string | null;
  baseLocation?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  distanceKm?: number | null;
  etaMinutes?: number | null;
  proximityStatus?: 'VERIFIED_PROXIMITY' | 'COORDINATES_UNAVAILABLE';
  city?: string;
}

export interface PersonalEmergencyContact {
  id: string;
  userId?: string;
  name: string;
  phone: string;
  relationship: string;
  notifyOnSosCreated?: boolean;
  notifyOnSync?: boolean;
  notifyOnDispatch?: boolean;
  notifyOnLowBattery: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface RelayNode {
  id: string;
  deviceName: string;
  latitude?: number | null;
  longitude?: number | null;
  batteryLevel: number;
  totalHopsRouted: number;
  lastSeen: string;
  status: 'ONLINE' | 'OFFLINE' | 'DEGRADED';
}

export interface DispatchAlertPayload {
  incidentId: string;
  status: 'IN_ACTION' | 'DISPATCHED';
  teamName: string;
  serviceType: string;
  contactNumber?: string | null;
  distanceKm?: number;
  etaMinutes?: number;
  message: string;
  dispatchedAt: string;
}

export interface VictimProfileSummary {
  id: string;
  displayName: string;
  email?: string | null;
  phoneNumber?: string | null;
  bloodGroup?: string | null;
  allergies?: string | null;
}

export interface Incident {
  id: string;
  userId?: string | null;
  anonymousId?: string | null;
  user?: VictimProfileSummary | null;
  emergencyCategory: EmergencyCategory;
  disasterSubtype?: DisasterType | null;
  priority: Priority;
  originalPriority?: Priority | null;
  description: string;
  latitude: number | null;
  longitude: number | null;
  locationAccuracy?: number | null;
  locationProtocol?: string;
  locationStatus?: 'GPS_VERIFIED' | 'LOCATION_UNAVAILABLE' | 'USER_PROVIDED';
  locationSource?: 'GPS' | 'NETWORK' | 'USER_MANUAL' | 'UNAVAILABLE';
  userProvidedAddress?: string | null;
  batteryLevel?: number | null;
  createdAt: string;
  receivedAt?: string | null;
  status: IncidentStatus;
  communicationMethod: CommunicationMethod;
  deliveryStatus: DeliveryStatus;
  acknowledgementReceived: boolean;
  hopCount: number;
  
  // Triage Metadata
  triageMethod?: string | null;
  triageRationale?: string | null;
  triageConfidence?: number | null;
  triageOverridden?: boolean;
  
  // Dispatch Info
  responseTeamId?: string | null;
  responseTeam?: ResponseTeam | null;
  dispatchedBy?: string | null;
  dispatchedAt?: string | null;
  dispatchReason?: string | null;
  operatorNotes?: string | null;

  attachments?: IncidentAttachment[];
  history?: IncidentHistoryItem[];
  telemetryEvents?: TelemetryEvent[];
}

export interface CreateIncidentPayload {
  id?: string;
  anonymousId?: string;
  emergencyCategory: EmergencyCategory;
  disasterSubtype?: DisasterType;
  priority?: Priority;
  description?: string;
  latitude?: number | null;
  longitude?: number | null;
  locationAccuracy?: number | null;
  locationProtocol?: string;
  locationStatus?: 'GPS_VERIFIED' | 'LOCATION_UNAVAILABLE' | 'USER_PROVIDED';
  locationSource?: 'GPS' | 'NETWORK' | 'USER_MANUAL' | 'UNAVAILABLE';
  userProvidedAddress?: string;
  batteryLevel?: number;
  communicationMethod?: CommunicationMethod;
  audioBlob?: Blob;
}

export interface EmergencyContact {
  id: string;
  serviceName: string;
  region: string;
  telephoneNumber: string;
  category: 'POLICE' | 'AMBULANCE' | 'FIRE' | 'WOMEN' | 'DISASTER' | 'GENERAL';
  verifiedAt: string;
  active: boolean;
  priorityOrder: number;
}

export interface MeshPacket {
  messageId: string;
  incidentId: string;
  originDeviceId: string;
  hopCount: number;
  maxHops: number;
  timestamp: number;
  expiresAt: number;
  payload: string; // Serialized encrypted or base64 incident payload
  checksum: string;
  lastRelayBy?: string;
}

export interface AIClassificationResult {
  category: EmergencyCategory;
  disasterSubtype?: DisasterType;
  priority: Priority;
  rationale: string;
  recommendedActions: string[];
  requiresImmediateServices: boolean;
  suggestedEmergencyNumber: string;
  isFallback: boolean;
  confidence?: number;
  modelOrRuleset?: string;
}

export interface QueuedOfflineIncident {
  localQueueId: string;
  incidentId: string;
  userId?: string | null;
  userName?: string | null;
  payload: any;
  audioBlob?: Blob;
  createdAt: number;
  retryCount: number;
  syncState?: 'LOCAL_PENDING' | 'SYNCING' | 'SERVER_RECEIVED' | 'ACKNOWLEDGED' | 'SYNC_FAILED';
  lastAttemptAt?: number;
}

export interface TelemetryEvent {
  id: string;
  incidentId: string;
  eventType: string; // CREATED_LOCALLY, TRANSMISSION_ATTEMPT, SERVER_RECEIVED, ACKNOWLEDGED, SYNC_COMPLETED
  transportType: string; // INTERNET_REST, WEBSOCKET, BLE_MESH, WIFI_DIRECT, SMS
  gatewayId?: string | null;
  attemptNumber: number;
  result: string; // SUCCESS, FAILED, PENDING
  durationMs?: number | null;
  errorCode?: string | null;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  userId?: string | null;
  userRole?: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
  details?: string | null;
  timestamp: string;
}
