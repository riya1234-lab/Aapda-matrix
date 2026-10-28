import { Router } from 'express';
import { aiController } from '../controllers/aiController';

const router = Router();

router.post('/classify', aiController.classify.bind(aiController));

export default router;
