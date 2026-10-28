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
  | 'PENDING'
  | 'ACKNOWLEDGED'
  | 'DISPATCHED'
  | 'IN_ACTION'
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
  | 'QUEUED'
  | 'TRANSMITTING'
  | 'DELIVERED_SERVER'
  | 'ACKNOWLEDGED';

export type UserRole = 'CITIZEN' | 'OPERATOR' | 'COMMANDER';

export interface LocationCoordinates {
  latitude: number | null;
  longitude: number | null;
  accuracy?: number | null;
  timestamp?: number;
  protocol?: string; // 'GPS' | 'NETWORK (IP)' | 'MANUAL' | 'UNAVAILABLE'
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
  distanceKm?: number;
  etaMinutes?: number;
  city?: string;
}

export interface PersonalEmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  notifyOnLowBattery: boolean;
  createdAt: string;
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

export interface Incident {
  id: string;
  userId?: string | null;
  anonymousId?: string | null;
  emergencyCategory: EmergencyCategory;
  disasterSubtype?: DisasterType | null;
  priority: Priority;
  description: string;
  latitude: number | null;
  longitude: number | null;
  locationAccuracy?: number | null;
  locationProtocol?: string;
  batteryLevel?: number | null;
  createdAt: string;
  receivedAt?: string | null;
  status: IncidentStatus;
  communicationMethod: CommunicationMethod;
  deliveryStatus: DeliveryStatus;
  acknowledgementReceived: boolean;
  hopCount: number;
  responseTeamId?: string | null;
  responseTeam?: ResponseTeam | null;
  attachments?: IncidentAttachment[];
  history?: IncidentHistoryItem[];
  operatorNotes?: string | null;
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
  suggestedEmergencyNumber?: string;
  isFallback: boolean;
}

export interface UserProfile {
  id: string;
  displayName: string;
  phoneNumber?: string;
  email?: string;
  role: UserRole;
  bloodGroup?: string;
  allergies?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  createdAt: string;
}

export interface DashboardStats {
  activeIncidents: number;
  criticalPriority: number;
  relayNodes: number;
  sarReadiness: 'High' | 'Normal' | 'Degraded';
  activeRedAlerts: number;
  threatCount: number;
  deployedAssets: number;
}
