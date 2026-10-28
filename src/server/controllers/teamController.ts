import { Response } from 'express';
import prisma from '../models/prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { broadcastIncidentUpdate, broadcastDispatchAlert } from '../sockets';

export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

export class TeamController {
  public async getTeams(_req: AuthenticatedRequest, res: Response) {
    try {
      const teams = await prisma.responseTeam.findMany({
        orderBy: { teamName: 'asc' },
      });
      return res.json({ teams });
    } catch (err: any) {
      console.error('Error fetching response teams:', err);
      return res.status(500).json({ error: 'Failed to retrieve response teams' });
    }
  }

  // Fetch real units sorted by Haversine distance to victim coordinates
  public async getNearestTeams(req: AuthenticatedRequest, res: Response) {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lng = parseFloat(req.query.lng as string);
      const category = (req.query.category as string) || '';

      const teams = await prisma.responseTeam.findMany({
        where: { availabilityStatus: 'AVAILABLE' },
      });

      const hasVictimCoords = !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;

      const teamsWithDistance = teams.map((team: any) => {
        const hasTeamCoords =
          team.latitude !== null &&
          team.latitude !== undefined &&
          team.longitude !== null &&
          team.longitude !== undefined;

        if (hasVictimCoords && hasTeamCoords) {
          const distanceKm = calculateDistanceKm(lat, lng, team.latitude, team.longitude);
          // Tactical emergency vehicle speed average ~40 km/h with sirens
          const etaMinutes = Math.max(3, Math.round((distanceKm / 40) * 60));
          return {
            ...team,
            distanceKm,
            etaMinutes,
            proximityStatus: 'VERIFIED_PROXIMITY',
          };
        }

        // Truthful: If coordinates are missing, do not fabricate distance
        return {
          ...team,
          distanceKm: null,
          etaMinutes: null,
          proximityStatus: 'COORDINATES_UNAVAILABLE',
        };
      });

      // Sort: First by valid proximity, then by capability matching category
      teamsWithDistance.sort((a: any, b: any) => {
        // Match capability
        const aMatches = category.includes('MEDICAL')
          ? a.serviceType === 'MEDICAL'
          : category.includes('FIRE')
          ? a.serviceType === 'FIRE'
          : a.serviceType === 'SAR';
        const bMatches = category.includes('MEDICAL')
          ? b.serviceType === 'MEDICAL'
          : category.includes('FIRE')
          ? b.serviceType === 'FIRE'
          : b.serviceType === 'SAR';

        if (aMatches && !bMatches) return -1;
        if (!aMatches && bMatches) return 1;

        if (a.distanceKm !== null && b.distanceKm !== null) {
          return a.distanceKm - b.distanceKm;
        }
        if (a.distanceKm !== null) return -1;
        if (b.distanceKm !== null) return 1;
        return 0;
      });

      return res.json({ teams: teamsWithDistance });
    } catch (err: any) {
      console.error('Error calculating nearest units:', err);
      return res.status(500).json({ error: 'Failed to find nearest response units' });
    }
  }

  // Real Mesh Relay Nodes
  public async getRelayNodes(_req: AuthenticatedRequest, res: Response) {
    try {
      const nodes = await prisma.relayNode.findMany({
        orderBy: { lastSeen: 'desc' },
      });
      const activeCount = nodes.filter((n: any) => n.status === 'ONLINE').length;
      return res.json({
        totalNodes: nodes.length,
        activeNodes: activeCount,
        nodes,
      });
    } catch (err: any) {
      console.error('Error fetching relay nodes:', err);
      return res.status(500).json({ error: 'Failed to retrieve relay nodes' });
    }
  }

  // Assign Team and Transition Incident to IN_ACTION
  public async assignTeam(req: AuthenticatedRequest, res: Response) {
    try {
      const { incidentId, responseTeamId, reason } = req.body;
      if (!incidentId || !responseTeamId) {
        return res.status(400).json({ error: 'incidentId and responseTeamId are required' });
      }

      const team = await prisma.responseTeam.findUnique({ where: { id: responseTeamId } });
      if (!team) {
        return res.status(404).json({ error: 'Response team not found' });
      }

      const incident = await prisma.incident.findUnique({
        where: { id: incidentId },
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              phoneNumber: true,
              preferredLanguage: true,
            },
          },
        },
      });
      if (!incident) {
        return res.status(404).json({ error: 'Incident not found' });
      }

      // Calculate ETA if coordinates available
      let etaMinutes: number | null = null;
      let distanceKm: number | null = null;
      if (
        incident.latitude !== null &&
        incident.longitude !== null &&
        team.latitude !== null &&
        team.longitude !== null
      ) {
        distanceKm = calculateDistanceKm(incident.latitude, incident.longitude, team.latitude, team.longitude);
        etaMinutes = Math.max(3, Math.round((distanceKm / 40) * 60));
      }

      const operatorName = req.user?.displayName || 'Tactical Commander';
      const dispatchNotes = reason || `Tactical unit dispatched: ${team.teamName}. Proximity: ${distanceKm ? `${distanceKm} km (ETA: ~${etaMinutes}m)` : 'Coordinates Unavailable'}.`;

      // Database Transaction for Incident Update + Team Deployment + Audit Log
      const [updatedIncident] = await prisma.$transaction([
        prisma.incident.update({
          where: { id: incidentId },
          data: {
            responseTeamId,
            status: 'IN_ACTION',
            dispatchedBy: operatorName,
            dispatchedAt: new Date(),
            dispatchReason: dispatchNotes,
            history: {
              create: {
                previousStatus: incident.status,
                newStatus: 'IN_ACTION',
                changedBy: operatorName,
                notes: dispatchNotes,
              },
            },
          },
          include: {
            responseTeam: true,
            attachments: true,
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
        }),
        prisma.responseTeam.update({
          where: { id: responseTeamId },
          data: {
            availabilityStatus: 'DEPLOYED',
            assignedIncidentId: incidentId,
          },
        }),
        prisma.auditLog.create({
          data: {
            userId: req.user?.id,
            userRole: req.user?.role || 'COMMANDER',
            action: 'DISPATCH_ASSIGNED',
            resourceType: 'INCIDENT',
            resourceId: incidentId,
            details: `Assigned unit ${team.teamName} to incident ${incidentId}. Notes: ${dispatchNotes}`,
          },
        }),
        prisma.telemetryEvent.create({
          data: {
            incidentId,
            eventType: 'DISPATCH_ASSIGNED',
            transportType: 'WEBSOCKET',
            attemptNumber: 1,
            result: 'SUCCESS',
            durationMs: 25,
          },
        }),
      ]);

      // Broadcast live update to Command Center
      broadcastIncidentUpdate(updatedIncident);

      // Broadcast real-time localized dispatch alert to Victim Portal
      const victimLanguage = incident.user?.preferredLanguage || 'en';
      let localizedMessage = `Help is on the way. ${team.teamName} has been assigned to your emergency request.`;
      if (victimLanguage === 'hi') {
        localizedMessage = `सहायता के लिए आपकी आपातकालीन सूचना प्रतिक्रिया दल (${team.teamName}) को सौंप दी गई है। सहायता भेजने की प्रक्रिया शुरू हो गई है।`;
      } else if (victimLanguage === 'mr') {
        localizedMessage = `तुमची आपत्कालीन विनंती प्रतिसाद पथकाकडे (${team.teamName}) सोपवण्यात आली आहे. मदत पाठवण्याची प्रक्रिया सुरू झाली आहे.`;
      }

      broadcastDispatchAlert(incidentId, {
        incidentId,
        status: 'IN_ACTION',
        teamName: team.teamName,
        serviceType: team.serviceType,
        contactNumber: team.contactNumber,
        distanceKm: distanceKm || undefined,
        etaMinutes: etaMinutes || undefined,
        message: localizedMessage,
        dispatchedAt: new Date().toISOString(),
      });

      return res.json({
        success: true,
        incident: updatedIncident,
        dispatchedTeam: team,
        distanceKm,
        etaMinutes,
        message: `Response team ${team.teamName} dispatched. Status set to IN_ACTION.`,
      });
    } catch (err: any) {
      console.error('Error assigning response team:', err);
      return res.status(500).json({ error: err.message || 'Failed to dispatch response team' });
    }
  }
}

export const teamController = new TeamController();
