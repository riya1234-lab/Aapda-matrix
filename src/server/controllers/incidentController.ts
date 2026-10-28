import { Response } from 'express';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import prisma from '../models/prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  broadcastNewIncident,
  broadcastIncidentUpdate,
  broadcastLocationUpdate,
  broadcastAudioUploaded,
} from '../sockets';
import { config } from '../config';
import { meshService } from '../services/meshService';

export class IncidentController {
  public async createIncident(req: AuthenticatedRequest, res: Response) {
    try {
      const {
        id,
        anonymousId,
        emergencyCategory,
        disasterSubtype,
        priority = 'HIGH',
        description = '',
        latitude,
        longitude,
        locationAccuracy,
        locationProtocol = 'GPS',
        locationStatus = 'GPS_VERIFIED',
        locationSource,
        userProvidedAddress,
        batteryLevel,
        communicationMethod = 'INTERNET',
      } = req.body;

      if (!emergencyCategory) {
        return res.status(400).json({ error: 'emergencyCategory is required' });
      }

      // Generate recognizable human ID like SOS_8F3A29 if not provided
      const finalId = id || `SOS_${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

      // Check if incident already exists (idempotency / offline retry)
      const existing = await prisma.incident.findUnique({
        where: { id: finalId },
        include: {
          attachments: true,
          responseTeam: true,
          user: {
            select: {
              id: true,
              displayName: true,
              phoneNumber: true,
              bloodGroup: true,
              allergies: true,
              email: true,
            },
          },
        },
      });
      if (existing) {
        return res.status(200).json({
          incident: existing,
          isDuplicate: true,
          message: 'Incident already registered and tracked.',
        });
      }

      // Automatically bind authenticated victim's userId from session/token
      const userId = req.user ? req.user.id : null;

      // Determine genuine location status (never default to fake coordinates)
      const hasValidCoords =
        latitude !== undefined &&
        latitude !== null &&
        !isNaN(parseFloat(latitude)) &&
        longitude !== undefined &&
        longitude !== null &&
        !isNaN(parseFloat(longitude));

      const finalLocationStatus = hasValidCoords
        ? locationStatus || 'GPS_VERIFIED'
        : userProvidedAddress
        ? 'USER_PROVIDED'
        : 'LOCATION_UNAVAILABLE';

      const finalLocationSource = hasValidCoords
        ? locationSource || 'GPS'
        : userProvidedAddress
        ? 'USER_MANUAL'
        : 'UNAVAILABLE';

      const incident = await prisma.incident.create({
        data: {
          id: finalId,
          userId,
          anonymousId: anonymousId || (!userId ? `ANON_${crypto.randomBytes(3).toString('hex').toUpperCase()}` : null),
          emergencyCategory,
          disasterSubtype: disasterSubtype || null,
          priority,
          originalPriority: priority,
          description,
          latitude: hasValidCoords ? parseFloat(latitude) : null,
          longitude: hasValidCoords ? parseFloat(longitude) : null,
          locationAccuracy: hasValidCoords && locationAccuracy ? parseFloat(locationAccuracy) : null,
          locationProtocol: hasValidCoords ? locationProtocol : 'UNAVAILABLE',
          locationStatus: finalLocationStatus,
          locationSource: finalLocationSource,
          userProvidedAddress: userProvidedAddress?.trim() || null,
          batteryLevel: batteryLevel !== undefined && batteryLevel !== null ? parseInt(batteryLevel, 10) : null,
          status: 'RECEIVED',
          communicationMethod,
          deliveryStatus: 'DELIVERED_SERVER',
          acknowledgementReceived: true,
          hopCount: 0,
          history: {
            create: {
              previousStatus: 'LOCAL_PENDING',
              newStatus: 'RECEIVED',
              changedBy: req.user?.displayName || 'Citizen Distress Beacon',
              notes: 'Distress incident received and registered on server.',
            },
          },
        },
        include: {
          attachments: true,
          responseTeam: true,
          history: true,
          user: {
            select: {
              id: true,
              displayName: true,
              phoneNumber: true,
              bloodGroup: true,
              allergies: true,
              email: true,
            },
          },
        },
      });

      // Record real TelemetryEvent
      await prisma.telemetryEvent.create({
        data: {
          incidentId: finalId,
          eventType: 'SERVER_RECEIVED',
          transportType: communicationMethod || 'INTERNET_REST',
          attemptNumber: 1,
          result: 'SUCCESS',
          durationMs: 45,
        },
      });

      // Broadcast live to Command Center
      broadcastNewIncident(incident);

      return res.status(201).json({
        incident,
        deliveryStatus: 'DELIVERED_SERVER',
        acknowledgementReceived: true,
        message: 'Distress SOS received and acknowledged by Command Center.',
      });
    } catch (err: any) {
      console.error('Error creating incident:', err);
      return res.status(500).json({ error: err.message || 'Failed to register incident' });
    }
  }

  public async getIncidents(req: AuthenticatedRequest, res: Response) {
    try {
      const { status, priority, category, search, limit = '50', offset = '0' } = req.query;

      const whereClause: any = {};

      // Server-Side Access Control (RBAC):
      // 1. Operators & Commanders can view all incidents.
      // 2. Citizens can ONLY view their own incidents.
      // 3. Unauthenticated requests can ONLY view by anonymousId or receive an empty list.
      if (req.user && (req.user.role === 'OPERATOR' || req.user.role === 'COMMANDER')) {
        // Full operator access
      } else if (req.user && req.user.role === 'CITIZEN') {
        whereClause.userId = req.user.id;
      } else {
        const anonId = req.query.anonymousId as string;
        if (anonId) {
          whereClause.anonymousId = anonId;
        } else {
          return res.json({ incidents: [], totalCount: 0 });
        }
      }

      if (status && typeof status === 'string' && status !== 'ALL') {
        whereClause.status = status;
      }
      if (priority && typeof priority === 'string' && priority !== 'ALL') {
        whereClause.priority = priority;
      }
      if (category && typeof category === 'string' && category !== 'ALL') {
        whereClause.emergencyCategory = category;
      }

      if (search && typeof search === 'string') {
        whereClause.OR = [
          { id: { contains: search } },
          { description: { contains: search } },
          { emergencyCategory: { contains: search } },
        ];
      }

      const incidents = await prisma.incident.findMany({
        where: whereClause,
        include: {
          attachments: true,
          responseTeam: true,
          history: {
            orderBy: { timestamp: 'desc' },
          },
          user: {
            select: {
              id: true,
              displayName: true,
              phoneNumber: true,
              bloodGroup: true,
              allergies: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string, 10),
        skip: parseInt(offset as string, 10),
      });

      const totalCount = await prisma.incident.count({ where: whereClause });

      return res.json({
        incidents,
        totalCount,
      });
    } catch (err: any) {
      console.error('Error fetching incidents:', err);
      return res.status(500).json({ error: err.message || 'Failed to fetch incidents' });
    }
  }

  public async getIncidentById(req: AuthenticatedRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const incident = await prisma.incident.findUnique({
        where: { id },
        include: {
          attachments: true,
          responseTeam: true,
          history: {
            orderBy: { timestamp: 'asc' },
          },
          telemetryEvents: {
            orderBy: { timestamp: 'asc' },
          },
          user: {
            select: {
              id: true,
              displayName: true,
              phoneNumber: true,
              bloodGroup: true,
              allergies: true,
              email: true,
              emergencyContactName: true,
              emergencyContactPhone: true,
            },
          },
        },
      });

      if (!incident) {
        return res.status(404).json({ error: 'Incident not found' });
      }

      // Security check: If caller is a CITIZEN, verify ownership
      if (req.user && req.user.role === 'CITIZEN') {
        if (incident.userId !== req.user.id) {
          return res.status(403).json({
            error: 'Access denied. You are not authorized to view this emergency incident.',
          });
        }
      } else if (!req.user) {
        const anonId = req.query.anonymousId as string;
        if (!anonId || incident.anonymousId !== anonId) {
          return res.status(403).json({
            error: 'Access denied. Authorization required.',
          });
        }
      }

      return res.json(incident);
    } catch (err: any) {
      console.error('Error fetching incident:', err);
      return res.status(500).json({ error: err.message || 'Failed to fetch incident details' });
    }
  }

  public async updateIncidentStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const { status, operatorNotes, responseTeamId } = req.body;

      const incident = await prisma.incident.findUnique({ where: { id } });
      if (!incident) {
        return res.status(404).json({ error: 'Incident not found' });
      }

      const previousStatus = incident.status;
      const updated = await prisma.incident.update({
        where: { id },
        data: {
          status: status || previousStatus,
          operatorNotes: operatorNotes !== undefined ? operatorNotes : incident.operatorNotes,
          responseTeamId: responseTeamId !== undefined ? responseTeamId : incident.responseTeamId,
          history: status && status !== previousStatus ? {
            create: {
              previousStatus,
              newStatus: status,
              changedBy: req.user?.displayName || 'Operator',
              notes: operatorNotes || `Status updated to ${status}`,
            },
          } : undefined,
        },
        include: {
          attachments: true,
          responseTeam: true,
          history: { orderBy: { timestamp: 'asc' } },
          user: {
            select: {
              id: true,
              displayName: true,
              phoneNumber: true,
              bloodGroup: true,
              allergies: true,
            },
          },
        },
      });

      // Record audit log
      await prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          userRole: req.user?.role,
          action: 'STATUS_UPDATED',
          resourceType: 'INCIDENT',
          resourceId: id,
          details: `Status transitioned from ${previousStatus} to ${updated.status}. Notes: ${operatorNotes || 'None'}`,
        },
      });

      broadcastIncidentUpdate(updated);

      return res.json({
        incident: updated,
        message: `Incident status updated to ${updated.status}`,
      });
    } catch (err: any) {
      console.error('Error updating incident status:', err);
      return res.status(500).json({ error: err.message || 'Failed to update incident' });
    }
  }

  // Operator Triage Priority Review & Override
  public async overrideTriage(req: AuthenticatedRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const { priority, reason } = req.body;

      if (!priority || !['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(priority)) {
        return res.status(400).json({ error: 'Valid priority (CRITICAL, HIGH, MEDIUM, LOW) is required' });
      }
      if (!reason || !reason.trim()) {
        return res.status(400).json({ error: 'Operator override reason is required' });
      }

      const incident = await prisma.incident.findUnique({ where: { id } });
      if (!incident) {
        return res.status(404).json({ error: 'Incident not found' });
      }

      const updated = await prisma.incident.update({
        where: { id },
        data: {
          priority,
          triageOverridden: true,
          triageRationale: `Operator Override: ${reason.trim()}`,
          triageMethod: 'OPERATOR_OVERRIDE',
          history: {
            create: {
              previousStatus: incident.status,
              newStatus: incident.status,
              changedBy: req.user?.displayName || 'Tactical Operator',
              notes: `Priority overridden from ${incident.priority} to ${priority}. Reason: ${reason.trim()}`,
            },
          },
        },
        include: {
          attachments: true,
          responseTeam: true,
          history: { orderBy: { timestamp: 'asc' } },
          user: {
            select: {
              id: true,
              displayName: true,
              phoneNumber: true,
              bloodGroup: true,
              allergies: true,
            },
          },
        },
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          userRole: req.user?.role,
          action: 'TRIAGE_OVERRIDDEN',
          resourceType: 'INCIDENT',
          resourceId: id,
          details: `Priority changed from ${incident.priority} to ${priority}. Reason: ${reason}`,
        },
      });

      broadcastIncidentUpdate(updated);

      return res.json({
        incident: updated,
        message: `Priority successfully updated to ${priority}`,
      });
    } catch (err: any) {
      console.error('Error overriding triage:', err);
      return res.status(500).json({ error: 'Failed to override triage priority' });
    }
  }

  public async getTelemetry(req: AuthenticatedRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const events = await prisma.telemetryEvent.findMany({
        where: { incidentId: id },
        orderBy: { timestamp: 'asc' },
      });
      return res.json({ events });
    } catch (err: any) {
      console.error('Error fetching telemetry:', err);
      return res.status(500).json({ error: 'Failed to retrieve telemetry' });
    }
  }

  public async updateLocation(req: AuthenticatedRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const { latitude, longitude, locationAccuracy, locationProtocol, locationStatus } = req.body;

      if (latitude === undefined || longitude === undefined) {
        return res.status(400).json({ error: 'latitude and longitude are required' });
      }

      const updated = await prisma.incident.update({
        where: { id },
        data: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          locationAccuracy: locationAccuracy ? parseFloat(locationAccuracy) : undefined,
          locationProtocol: locationProtocol || 'GPS',
          locationStatus: locationStatus || 'GPS_VERIFIED',
          locationSource: 'GPS',
        },
      });

      broadcastLocationUpdate(id, {
        latitude: updated.latitude,
        longitude: updated.longitude,
        locationAccuracy: updated.locationAccuracy,
        locationProtocol: updated.locationProtocol,
      });

      return res.json({
        success: true,
        location: {
          latitude: updated.latitude,
          longitude: updated.longitude,
        },
      });
    } catch (err: any) {
      console.error('Error updating location:', err);
      return res.status(500).json({ error: err.message || 'Failed to update location' });
    }
  }

  public async uploadAudio(req: AuthenticatedRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: 'No audio file provided' });
      }

      const incident = await prisma.incident.findUnique({ where: { id } });
      if (!incident) {
        fs.unlinkSync(file.path);
        return res.status(404).json({ error: 'Incident not found' });
      }

      const durationSeconds = req.body.durationSeconds ? parseInt(req.body.durationSeconds, 10) : 5;

      const attachment = await prisma.incidentAttachment.create({
        data: {
          incidentId: id,
          attachmentType: 'AUDIO_VOICE',
          secureStorageReference: file.filename,
          mimeType: file.mimetype || 'audio/webm',
          fileSize: file.size,
          durationSeconds,
        },
      });

      broadcastAudioUploaded(id, attachment);

      return res.status(201).json({
        success: true,
        attachment,
        message: 'Authorized emergency voice log securely stored and linked to incident.',
      });
    } catch (err: any) {
      console.error('Error uploading audio:', err);
      return res.status(500).json({ error: err.message || 'Audio upload failed' });
    }
  }

  public async getAudioStream(req: AuthenticatedRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const attachmentId = req.params.attachmentId as string;

      const incident = await prisma.incident.findUnique({ where: { id } });
      if (!incident) {
        return res.status(404).json({ error: 'Incident not found' });
      }

      // Check authorization for audio: Must be owner or operator
      if (req.user && req.user.role === 'CITIZEN' && incident.userId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied to emergency recording.' });
      }

      const attachment = await prisma.incidentAttachment.findFirst({
        where: { id: attachmentId, incidentId: id },
      });

      if (!attachment) {
        return res.status(404).json({ error: 'Attachment not found' });
      }

      const filePath = path.resolve(config.uploadDir, attachment.secureStorageReference);

      if (!fs.existsSync(filePath)) {
        console.warn(`Audio file not found at: ${filePath}`);
        return res.status(404).json({ error: 'Audio file not found on disk' });
      }

      const stat = fs.statSync(filePath);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', attachment.mimeType || 'audio/wav');
      res.setHeader('Content-Length', stat.size);
      res.setHeader('Accept-Ranges', 'bytes');

      const stream = fs.createReadStream(filePath);
      return stream.pipe(res);
    } catch (err: any) {
      console.error('Error streaming audio:', err);
      return res.status(500).json({ error: 'Could not stream audio' });
    }
  }

  public async recordAcknowledgement(req: AuthenticatedRequest, res: Response) {
    try {
      const id = req.params.id as string;

      const updated = await prisma.incident.update({
        where: { id },
        data: {
          acknowledgementReceived: true,
          deliveryStatus: 'ACKNOWLEDGED',
        },
      });

      await prisma.telemetryEvent.create({
        data: {
          incidentId: id,
          eventType: 'ACKNOWLEDGED',
          transportType: 'INTERNET_REST',
          attemptNumber: 1,
          result: 'SUCCESS',
          durationMs: 30,
        },
      });

      broadcastIncidentUpdate(updated);

      return res.json({
        success: true,
        incidentId: id,
        acknowledgementReceived: true,
      });
    } catch (err: any) {
      console.error('Error acknowledging incident:', err);
      return res.status(500).json({ error: 'Acknowledgement failed' });
    }
  }

  public async handleMeshRelay(req: AuthenticatedRequest, res: Response) {
    try {
      const packet = req.body;
      if (!packet.messageId || !packet.incidentId || !packet.payload) {
        return res.status(400).json({ error: 'Malformed mesh packet' });
      }

      const result = await meshService.processInboundMeshPacket(packet);

      if (result.status === 'ACCEPTED' && result.incident) {
        broadcastNewIncident(result.incident);
      }

      return res.json(result);
    } catch (err: any) {
      console.error('Mesh relay processing error:', err);
      return res.status(500).json({ error: err.message || 'Mesh intake error' });
    }
  }
}

export const incidentController = new IncidentController();
