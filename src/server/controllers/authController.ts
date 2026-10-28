import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../models/prisma';
import { generateToken, AuthenticatedRequest } from '../middleware/auth';

export class AuthController {
  // Victim / Citizen Portal Login
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
          allergies: user.allergies,
          preferredLanguage: user.preferredLanguage || 'en',
          address: user.address,
        },
      });
    } catch (err: any) {
      console.error('Login error:', err);
      return res.status(500).json({ error: 'Login failed' });
    }
  }

  // Victim / Citizen Registration
  public async register(req: Request, res: Response) {
    try {
      const {
        displayName,
        email,
        password,
        phoneNumber,
        bloodGroup,
        allergies,
        preferredLanguage = 'en',
        address,
        emergencyContactName,
        emergencyContactPhone,
      } = req.body;

      if (!displayName || !displayName.trim()) {
        return res.status(400).json({ error: 'Full name is required' });
      }
      if (!email || !email.trim()) {
        return res.status(400).json({ error: 'Email is required' });
      }
      if (!password || password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      }

      const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
      if (existing) {
        return res.status(409).json({ error: 'An account with this email already exists' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          displayName: displayName.trim(),
          email: email.trim().toLowerCase(),
          passwordHash,
          role: 'CITIZEN',
          phoneNumber: phoneNumber?.trim() || null,
          bloodGroup: bloodGroup?.trim() || null,
          allergies: allergies?.trim() || null,
          preferredLanguage,
          address: address?.trim() || null,
          emergencyContactName: emergencyContactName?.trim() || null,
          emergencyContactPhone: emergencyContactPhone?.trim() || null,
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
          phoneNumber: user.phoneNumber,
          bloodGroup: user.bloodGroup,
          allergies: user.allergies,
          preferredLanguage: user.preferredLanguage,
        },
      });
    } catch (err: any) {
      console.error('Registration error:', err);
      return res.status(500).json({ error: 'Registration failed' });
    }
  }

  // Current Authenticated User Profile
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
          preferredLanguage: true,
          address: true,
          emergencyContactName: true,
          emergencyContactPhone: true,
          createdAt: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: 'User profile not found' });
      }

      return res.json({ user });
    } catch (err: any) {
      console.error('Get profile error:', err);
      return res.status(500).json({ error: 'Could not fetch profile' });
    }
  }

  // Update Profile
  public async updateProfile(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const {
        displayName,
        phoneNumber,
        bloodGroup,
        allergies,
        preferredLanguage,
        address,
        emergencyContactName,
        emergencyContactPhone,
      } = req.body;

      if (displayName !== undefined && !displayName.trim()) {
        return res.status(400).json({ error: 'Full name cannot be empty' });
      }

      const updated = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          displayName: displayName !== undefined ? displayName.trim() : undefined,
          phoneNumber: phoneNumber !== undefined ? phoneNumber : undefined,
          bloodGroup: bloodGroup !== undefined ? bloodGroup : undefined,
          allergies: allergies !== undefined ? allergies : undefined,
          preferredLanguage: preferredLanguage !== undefined ? preferredLanguage : undefined,
          address: address !== undefined ? address : undefined,
          emergencyContactName: emergencyContactName !== undefined ? emergencyContactName : undefined,
          emergencyContactPhone: emergencyContactPhone !== undefined ? emergencyContactPhone : undefined,
        },
      });

      // Record audit log
      await prisma.auditLog.create({
        data: {
          userId: updated.id,
          userRole: updated.role,
          action: 'PROFILE_UPDATED',
          resourceType: 'USER',
          resourceId: updated.id,
          details: `User ${updated.displayName} updated profile fields.`,
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
          preferredLanguage: updated.preferredLanguage,
          address: updated.address,
          emergencyContactName: updated.emergencyContactName,
          emergencyContactPhone: updated.emergencyContactPhone,
        },
        message: 'Profile updated successfully',
      });
    } catch (err: any) {
      console.error('Update profile error:', err);
      return res.status(500).json({ error: 'Could not update profile' });
    }
  }

  // Operator Workstation Access (Command Center without public civilian login form)
  public async operatorSession(req: Request, res: Response) {
    try {
      const { passkey } = req.body;
      const expectedPasskey = process.env.OPERATOR_PASSKEY || 'AAPDA_OPS_TACTICAL_2026';

      if (!passkey || passkey !== expectedPasskey) {
        return res.status(401).json({
          error: 'Unauthorized operational access. Valid operator terminal passkey required.',
        });
      }

      // Find or create the dedicated HQ Commander user
      let commander = await prisma.user.findFirst({
        where: { role: 'COMMANDER' },
      });

      if (!commander) {
        commander = await prisma.user.create({
          data: {
            displayName: 'Commander Rajesh Sharma (HQ)',
            email: 'commander@aapdamatrix.org',
            role: 'COMMANDER',
          },
        });
      }

      const token = generateToken({
        id: commander.id,
        displayName: commander.displayName,
        email: commander.email || undefined,
        role: 'COMMANDER',
      });

      // Record operational audit
      await prisma.auditLog.create({
        data: {
          userId: commander.id,
          userRole: 'COMMANDER',
          action: 'OPERATOR_SESSION_AUTHORIZED',
          resourceType: 'STATION',
          resourceId: req.ip || '127.0.0.1',
          details: 'Command Center operator workstation authenticated.',
        },
      });

      return res.json({
        token,
        user: {
          id: commander.id,
          displayName: commander.displayName,
          email: commander.email,
          role: commander.role,
        },
        message: 'Operator tactical session authenticated.',
      });
    } catch (err: any) {
      console.error('Operator session error:', err);
      return res.status(500).json({ error: 'Failed to authorize operator session' });
    }
  }
}

export const authController = new AuthController();
