import { Response } from 'express';
import prisma from '../models/prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { broadcastIncidentUpdate, broadcastDispatchAlert } from '../sockets';

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

      const teams = await prisma.responseTeam.findMany({
        where: { availabilityStatus: 'AVAILABLE' },
      });

      if (isNaN(lat) || isNaN(lng)) {
        return res.json({ teams });
      }

      const teamsWithDistance = teams.map((team: any) => {
        let distanceKm = 10; // Default sensible fallback
        if (team.latitude && team.longitude) {
          distanceKm = calculateDistanceKm(lat, lng, team.latitude, team.longitude);
        }
        // Emergency vehicle speed average ~40 km/h with sirens
        const etaMinutes = Math.max(3, Math.round((distanceKm / 40) * 60));

        return {
          ...team,
          distanceKm,
          etaMinutes,
        };
      });

      teamsWithDistance.sort((a: any, b: any) => a.distanceKm - b.distanceKm);

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

  public async assignTeam(req: AuthenticatedRequest, res: Response) {
    try {
      const { incidentId, responseTeamId } = req.body;
      if (!incidentId || !responseTeamId) {
        return res.status(400).json({ error: 'incidentId and responseTeamId are required' });
      }

      const team = await prisma.responseTeam.findUnique({ where: { id: responseTeamId } });
      if (!team) {
        return res.status(404).json({ error: 'Response team not found' });
      }

      const incident = await prisma.incident.findUnique({ where: { id: incidentId } });
      if (!incident) {
        return res.status(404).json({ error: 'Incident not found' });
      }

      // Calculate ETA if coordinates available
      let etaMinutes = 12;
      let distanceKm = 5.0;
      if (incident.latitude && incident.longitude && team.latitude && team.longitude) {
        distanceKm = calculateDistanceKm(incident.latitude, incident.longitude, team.latitude, team.longitude);
        etaMinutes = Math.max(3, Math.round((distanceKm / 40) * 60));
      }

      // Update incident with team and set status to IN_ACTION (dispatched)
      const updatedIncident = await prisma.incident.update({
        where: { id: incidentId },
        data: {
          responseTeamId,
          status: 'IN_ACTION',
          history: {
            create: {
              previousStatus: incident.status,
              newStatus: 'IN_ACTION',
              changedBy: req.user?.displayName || 'Command Operator',
              notes: `Tactical unit dispatched: ${team.teamName}. Distance: ${distanceKm} km. ETA: ~${etaMinutes} mins.`,
            },
          },
        },
        include: {
          responseTeam: true,
          attachments: true,
          history: { orderBy: { timestamp: 'asc' } },
        },
      });

      // Update team availability
      await prisma.responseTeam.update({
        where: { id: responseTeamId },
        data: {
          availabilityStatus: 'DEPLOYED',
          assignedIncidentId: incidentId,
        },
      });

      // 1. Broadcast standard update
      broadcastIncidentUpdate(updatedIncident);

      // 2. Broadcast high-priority "Help is on the way" alert to victim
      broadcastDispatchAlert(incidentId, {
        incidentId,
        status: 'IN_ACTION',
        teamName: team.teamName,
        serviceType: team.serviceType,
        contactNumber: team.contactNumber,
        distanceKm,
        etaMinutes,
        message: `Help is on the way! ${team.teamName} has been dispatched to your exact location. ETA: ~${etaMinutes} minutes. Stay calm and remain at your position.`,
        dispatchedAt: new Date().toISOString(),
      });

      return res.json({
        success: true,
        incident: updatedIncident,
        etaMinutes,
        message: `Assigned and dispatched ${team.teamName} (In Action). Victim notified.`,
      });
    } catch (err: any) {
      console.error('Error assigning response team:', err);
      return res.status(500).json({ error: 'Failed to assign response team' });
    }
  }
}

export const teamController = new TeamController();
