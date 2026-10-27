import axios from 'axios';
import { Incident, AIClassificationResult, EmergencyContact, ResponseTeam } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Request interceptor to attach JWT token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('aapda_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  // Health & Reachability check (distinguishes real internet from captive Wi-Fi)
  async checkHealth(): Promise<boolean> {
    try {
      const res = await apiClient.get('/health', { timeout: 3500 });
      return res.data?.status === 'ONLINE';
    } catch {
      return false;
    }
  },

  // Incident APIs
  async createIncident(payload: any): Promise<{ incident: Incident; deliveryStatus: string }> {
    const res = await apiClient.post('/incidents', payload);
    return res.data;
  },

  async getIncidents(params?: { status?: string; priority?: string; category?: string; search?: string }): Promise<{ incidents: Incident[]; totalCount: number }> {
    const res = await apiClient.get('/incidents', { params });
    return res.data;
  },

  async getIncidentById(id: string): Promise<Incident> {
    const res = await apiClient.get(`/incidents/${id}`);
    return res.data;
  },

  async updateIncidentStatus(id: string, status: string, operatorNotes?: string, responseTeamId?: string): Promise<{ incident: Incident }> {
    const res = await apiClient.patch(`/incidents/${id}/status`, { status, operatorNotes, responseTeamId });
    return res.data;
  },

  async updateLocation(id: string, latitude: number, longitude: number, locationAccuracy?: number): Promise<void> {
    await apiClient.post(`/incidents/${id}/location`, { latitude, longitude, locationAccuracy });
  },

  async uploadAudio(id: string, audioBlob: Blob, durationSeconds = 5): Promise<any> {
    const formData = new FormData();
    formData.append('audio', audioBlob, `voice_sos_${id}.webm`);
    formData.append('durationSeconds', durationSeconds.toString());

    const res = await apiClient.post(`/incidents/${id}/audio`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  getAudioStreamUrl(incidentId: string, attachmentId: string): string {
    return `${API_BASE_URL}/incidents/${incidentId}/audio/${attachmentId}`;
  },

  // AI Classification
  async classifyEmergency(description: string): Promise<AIClassificationResult> {
    const res = await apiClient.post('/ai/classify', { description });
    return res.data;
  },

  // Emergency Contacts
  async getContacts(): Promise<{ contacts: EmergencyContact[] }> {
    const res = await apiClient.get('/emergency-contacts');
    return res.data;
  },

  // Response Teams
  async getResponseTeams(): Promise<{ teams: ResponseTeam[] }> {
    const res = await apiClient.get('/response-teams');
    return res.data;
  },

  async assignResponseTeam(incidentId: string, responseTeamId: string): Promise<any> {
    const res = await apiClient.post('/response-teams/assign', { incidentId, responseTeamId });
    return res.data;
  },

  // Inbound Mesh Relay
  async sendMeshRelay(packet: any): Promise<any> {
    const res = await apiClient.post('/incidents/relay/mesh', packet);
    return res.data;
  },
};
