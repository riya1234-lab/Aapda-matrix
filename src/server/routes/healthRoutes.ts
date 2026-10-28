import { Router, Request, Response } from 'express';
import prisma from '../models/prisma';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    // Quick DB liveness check
    await prisma.$queryRaw`SELECT 1`;
    return res.json({
      status: 'ONLINE',
      platform: 'AAPDA MATRIX Emergency Response Gateway',
      version: '4.0.0',
      timestamp: new Date().toISOString(),
      database: 'CONNECTED',
      telemetry: {
        meshRelayActive: true,
        aiTriageReady: true,
      },
    });
  } catch (err: any) {
    return res.status(503).json({
      status: 'DEGRADED',
      platform: 'AAPDA MATRIX Emergency Response Gateway',
      error: 'Database connection check failed',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
