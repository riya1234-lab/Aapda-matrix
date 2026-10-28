import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Victim Portal Auth
router.post('/login', authController.login.bind(authController));
router.post('/register', authController.register.bind(authController));
router.get('/profile', authenticate, authController.getProfile.bind(authController));
router.get('/me', authenticate, authController.getProfile.bind(authController));
router.patch('/profile', authenticate, authController.updateProfile.bind(authController));

// Operator Terminal Workstation Session
router.post('/operator-session', authController.operatorSession.bind(authController));

export default router;
