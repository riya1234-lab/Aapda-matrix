import { Response } from 'express';
import prisma from '../models/prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { broadcastIncidentUpdate } from '../sockets';

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

      // Update incident with team and set status to DISPATCHED
      const updatedIncident = await prisma.incident.update({
        where: { id: incidentId },
        data: {
          responseTeamId,
          status: 'DISPATCHED',
          history: {
            create: {
              previousStatus: incident.status,
              newStatus: 'DISPATCHED',
              changedBy: req.user?.displayName || 'Tactical Operator',
              notes: `Assigned response team: ${team.teamName} (${team.serviceType})`,
            },
          },
        },
        include: {
          responseTeam: true,
          attachments: true,
          history: { orderBy: { timestamp: 'asc' } },
        },
      });

      // Update team status
      await prisma.responseTeam.update({
        where: { id: responseTeamId },
        data: {
          availabilityStatus: 'DEPLOYED',
          assignedIncidentId: incidentId,
        },
      });

      broadcastIncidentUpdate(updatedIncident);

      return res.json({
        success: true,
        incident: updatedIncident,
        message: `Assigned ${team.teamName} to incident ${incidentId}`,
      });
    } catch (err: any) {
      console.error('Error assigning response team:', err);
      return res.status(500).json({ error: 'Failed to assign response team' });
    }
  }
}

export const teamController = new TeamController();
