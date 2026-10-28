import { Router } from 'express';
import { contactController } from '../controllers/contactController';

const router = Router();

router.get('/', contactController.getContacts.bind(contactController));

export default router;
