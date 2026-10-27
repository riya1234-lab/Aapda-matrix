import { Router } from 'express';
import { teamController } from '../controllers/teamController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Operators & Commanders can view and assign teams
router.get('/', authenticate, requireRole(['OPERATOR', 'COMMANDER']), teamController.getTeams.bind(teamController));
router.post('/assign', authenticate, requireRole(['OPERATOR', 'COMMANDER']), teamController.assignTeam.bind(teamController));

export default router;
