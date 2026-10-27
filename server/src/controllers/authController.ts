import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../models/prisma';
import { generateToken, AuthenticatedRequest } from '../middleware/auth';

export class AuthController {
  public async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !user.passwordHash) {
        return res.status(401).json({ error: 'Invalid email or credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or credentials' });
      }

      const token = generateToken({
        id: user.id,
        displayName: user.displayName,
        email: user.email || undefined,
        role: user.role as any,
      });

      return res.json({
        token,
        user: {
          id: user.id,
          displayName: user.displayName,
          email: user.email,
          role: user.role,
          phoneNumber: user.phoneNumber,
          bloodGroup: user.bloodGroup,
        },
      });
    } catch (err: any) {
      console.error('Login error:', err);
      return res.status(500).json({ error: 'Login failed' });
    }
  }

  public async register(req: Request, res: Response) {
    try {
      const { displayName, email, password, phoneNumber, bloodGroup, allergies, emergencyContactName, emergencyContactPhone } = req.body;

      if (!displayName || !email || !password) {
        return res.status(400).json({ error: 'displayName, email, and password are required' });
      }

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return res.status(409).json({ error: 'User with this email already exists' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          displayName,
          email,
          passwordHash,
          role: 'CITIZEN',
          phoneNumber,
          bloodGroup,
          allergies,
          emergencyContactName,
          emergencyContactPhone,
        },
      });

      const token = generateToken({
        id: user.id,
        displayName: user.displayName,
        email: user.email || undefined,
        role: user.role as any,
      });

      return res.status(201).json({
        token,
        user: {
          id: user.id,
          displayName: user.displayName,
          email: user.email,
          role: user.role,
        },
      });
    } catch (err: any) {
      console.error('Registration error:', err);
      return res.status(500).json({ error: 'Registration failed' });
    }
  }

  public async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          displayName: true,
          email: true,
          role: true,
          phoneNumber: true,
          bloodGroup: true,
          allergies: true,
          emergencyContactName: true,
          emergencyContactPhone: true,
          createdAt: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.json({ user });
    } catch (err: any) {
      console.error('Get profile error:', err);
      return res.status(500).json({ error: 'Could not fetch profile' });
    }
  }

  public async updateProfile(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { displayName, phoneNumber, bloodGroup, allergies, emergencyContactName, emergencyContactPhone } = req.body;

      const updated = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          displayName,
          phoneNumber,
          bloodGroup,
          allergies,
          emergencyContactName,
          emergencyContactPhone,
        },
      });

      return res.json({
        user: {
          id: updated.id,
          displayName: updated.displayName,
          email: updated.email,
          role: updated.role,
          phoneNumber: updated.phoneNumber,
          bloodGroup: updated.bloodGroup,
          allergies: updated.allergies,
          emergencyContactName: updated.emergencyContactName,
          emergencyContactPhone: updated.emergencyContactPhone,
        },
      });
    } catch (err: any) {
      console.error('Update profile error:', err);
      return res.status(500).json({ error: 'Could not update profile' });
    }
  }
}

export const authController = new AuthController();
