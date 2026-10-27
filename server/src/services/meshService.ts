import crypto from 'crypto';
import prisma from '../models/prisma';

export interface RawMeshPacket {
  messageId: string;
  incidentId: string;
  originDeviceId: string;
  hopCount: number;
  maxHops?: number;
  timestamp: number;
  expiresAt: number;
  payload: string; // Base64 or JSON string of incident
  checksum: string;
  relayPath?: string[];
}

export class MeshService {
  private processedMessages = new Set<string>();

  constructor() {
    // Periodically clean up processed messages older than 24 hours
    setInterval(() => {
      this.cleanupDeduplicationCache();
    }, 60 * 60 * 1000);
  }

  private cleanupDeduplicationCache() {
    if (this.processedMessages.size > 10000) {
      this.processedMessages.clear();
    }
  }

  public verifyChecksum(packet: RawMeshPacket): boolean {
    const rawData = `${packet.messageId}:${packet.incidentId}:${packet.originDeviceId}:${packet.timestamp}:${packet.payload}`;
    const calculated = crypto.createHash('sha256').update(rawData).digest('hex').substring(0, 16);
    return calculated === packet.checksum;
  }

  public static generatePacket(
    incidentId: string,
    originDeviceId: string,
    payloadObj: any,
    maxHops = 5
  ): RawMeshPacket {
    const messageId = `MSG_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const timestamp = Date.now();
    const expiresAt = timestamp + 72 * 60 * 60 * 1000; // 72-hour disaster window
    const payload = JSON.stringify(payloadObj);
    const rawData = `${messageId}:${incidentId}:${originDeviceId}:${timestamp}:${payload}`;
    const checksum = crypto.createHash('sha256').update(rawData).digest('hex').substring(0, 16);

    return {
      messageId,
      incidentId,
      originDeviceId,
      hopCount: 0,
      maxHops,
      timestamp,
      expiresAt,
      payload,
      checksum,
      relayPath: [originDeviceId],
    };
  }

  public async processInboundMeshPacket(packet: RawMeshPacket): Promise<{
    status: 'ACCEPTED' | 'DUPLICATE' | 'EXPIRED' | 'MAX_HOPS_EXCEEDED' | 'INVALID_CHECKSUM';
    incident?: any;
    message: string;
  }> {
    // 1. Deduplication check
    if (this.processedMessages.has(packet.messageId)) {
      return { status: 'DUPLICATE', message: 'Message ID already processed by gateway' };
    }

    // 2. Check if already in database
    const existingRelay = await prisma.messageRelay.findUnique({
      where: { messageId: packet.messageId },
    });
    if (existingRelay) {
      this.processedMessages.add(packet.messageId);
      return { status: 'DUPLICATE', message: 'Relay packet already recorded in database' };
    }

    // 3. Expiration check
    if (Date.now() > packet.expiresAt) {
      return { status: 'EXPIRED', message: 'Emergency packet TTL has expired' };
    }

    // 4. Max hops check
    const maxHops = packet.maxHops || 5;
    if (packet.hopCount > maxHops) {
      return { status: 'MAX_HOPS_EXCEEDED', message: 'Hop limit exceeded; dropping packet' };
    }

    // 5. Checksum verification
    if (!this.verifyChecksum(packet)) {
      return { status: 'INVALID_CHECKSUM', message: 'Packet integrity check failed' };
    }

    // 6. Parse incident payload
    let incidentData: any;
    try {
      incidentData = JSON.parse(packet.payload);
    } catch {
      return { status: 'INVALID_CHECKSUM', message: 'Malformed JSON payload' };
    }

    // 7. Store or update incident in database
    const incidentId = packet.incidentId || incidentData.id;
    const existingIncident = await prisma.incident.findUnique({ where: { id: incidentId } });

    let finalIncident;
    if (!existingIncident) {
      finalIncident = await prisma.incident.create({
        data: {
          id: incidentId,
          userId: incidentData.userId || null,
          anonymousId: incidentData.anonymousId || packet.originDeviceId,
          emergencyCategory: incidentData.emergencyCategory || 'OTHER',
          disasterSubtype: incidentData.disasterSubtype || null,
          priority: incidentData.priority || 'CRITICAL',
          description: incidentData.description || 'Distress SOS relayed via Mesh network',
          latitude: incidentData.latitude ? parseFloat(incidentData.latitude) : null,
          longitude: incidentData.longitude ? parseFloat(incidentData.longitude) : null,
          locationAccuracy: incidentData.locationAccuracy ? parseFloat(incidentData.locationAccuracy) : null,
          locationProtocol: 'BLE_MESH_RELAY',
          batteryLevel: incidentData.batteryLevel ? parseInt(incidentData.batteryLevel, 10) : null,
          status: 'PENDING',
          communicationMethod: 'BLE_MESH',
          deliveryStatus: 'DELIVERED_SERVER',
          acknowledgementReceived: true,
          hopCount: packet.hopCount,
          history: {
            create: {
              previousStatus: 'PENDING',
              newStatus: 'PENDING',
              changedBy: `Gateway Mesh Relay (${packet.originDeviceId})`,
              notes: `Packet traversed ${packet.hopCount} mesh hops before reaching gateway.`,
            },
          },
        },
      });
    } else {
      finalIncident = existingIncident;
    }

    // Record the relay packet
    await prisma.messageRelay.create({
      data: {
        messageId: packet.messageId,
        incidentId: finalIncident.id,
        originDeviceId: packet.originDeviceId,
        hopCount: packet.hopCount,
        maxHops,
        expiresAt: new Date(packet.expiresAt),
        deliveryStatus: 'DELIVERED_SERVER',
      },
    });

    this.processedMessages.add(packet.messageId);

    return {
      status: 'ACCEPTED',
      incident: finalIncident,
      message: `Incident ${finalIncident.id} successfully ingested from mesh gateway after ${packet.hopCount} hops.`,
    };
  }
}

export const meshService = new MeshService();
