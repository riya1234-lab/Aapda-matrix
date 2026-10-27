import { Request, Response } from 'express';
import prisma from '../models/prisma';

export class ContactController {
  public async getContacts(_req: Request, res: Response) {
    try {
      const contacts = await prisma.emergencyContact.findMany({
        where: { active: true },
        orderBy: { priorityOrder: 'asc' },
      });
      return res.json({ contacts });
    } catch (err: any) {
      console.error('Error fetching emergency contacts:', err);
      return res.status(500).json({ error: 'Failed to retrieve emergency contacts' });
    }
  }
}

export const contactController = new ContactController();
