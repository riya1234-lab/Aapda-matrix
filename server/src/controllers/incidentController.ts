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
        include: { attachments: true, responseTeam: true },
      });
      if (existing) {
        return res.status(200).json({
          incident: existing,
          isDuplicate: true,
          message: 'Incident already registered and tracked.',
        });
      }

      const userId = req.user ? req.user.id : null;

      const incident = await prisma.incident.create({
        data: {
          id: finalId,
          userId,
          anonymousId: anonymousId || (!userId ? `ANON_${crypto.randomBytes(3).toString('hex').toUpperCase()}` : null),
          emergencyCategory,
          disasterSubtype: disasterSubtype || null,
          priority,
          description,
          latitude: latitude !== undefined && latitude !== null ? parseFloat(latitude) : null,
          longitude: longitude !== undefined && longitude !== null ? parseFloat(longitude) : null,
          locationAccuracy: locationAccuracy !== undefined && locationAccuracy !== null ? parseFloat(locationAccuracy) : null,
          locationProtocol,
          batteryLevel: batteryLevel !== undefined && batteryLevel !== null ? parseInt(batteryLevel, 10) : null,
          status: 'PENDING',
          communicationMethod,
          deliveryStatus: 'DELIVERED_SERVER',
          acknowledgementReceived: true,
          hopCount: 0,
          history: {
            create: {
              previousStatus: 'PENDING',
              newStatus: 'PENDING',
              changedBy: req.user?.displayName || 'Citizen Distress Beacon',
              notes: 'Distress incident registered via primary API channel.',
            },
          },
        },
        include: {
          attachments: true,
          responseTeam: true,
          history: true,
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

      // If user is a CITIZEN, only show their own or their anonymous incidents
      if (req.user && req.user.role === 'CITIZEN') {
        whereClause.userId = req.user.id;
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
      const { id } = req.params;
      const incident = await prisma.incident.findUnique({
        where: { id },
        include: {
          attachments: true,
          responseTeam: true,
          history: {
            orderBy: { timestamp: 'asc' },
          },
          user: {
            select: {
              id: true,
              displayName: true,
              phoneNumber: true,
              bloodGroup: true,
              allergies: true,
              emergencyContactName: true,
              emergencyContactPhone: true,
            },
          },
        },
      });

      if (!incident) {
        return res.status(404).json({ error: 'Incident not found' });
      }

      return res.json(incident);
    } catch (err: any) {
      console.error('Error fetching incident:', err);
      return res.status(500).json({ error: err.message || 'Failed to fetch incident details' });
    }
  }

  public async updateIncidentStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
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

  public async updateLocation(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { latitude, longitude, locationAccuracy, locationProtocol } = req.body;

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
      const { id } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: 'No audio file provided' });
      }

      const incident = await prisma.incident.findUnique({ where: { id } });
      if (!incident) {
        // Clean up file if incident does not exist
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
      const { id, attachmentId } = req.params;

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
      const { id } = req.params;

      const updated = await prisma.incident.update({
        where: { id },
        data: {
          acknowledgementReceived: true,
          deliveryStatus: 'ACKNOWLEDGED',
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
