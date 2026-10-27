import { Request, Response } from 'express';
import { aiService } from '../services/aiService';

export class AIController {
  public async classify(req: Request, res: Response) {
    try {
      const { description } = req.body;
      if (!description || typeof description !== 'string') {
        return res.status(400).json({ error: 'Description text is required for AI classification' });
      }

      const result = await aiService.classifyEmergency(description);
      return res.json(result);
    } catch (err: any) {
      console.error('AI Classification API Error:', err);
      // Even if catastrophic error, return safe local fallback
      const fallback = aiService.localFallbackClassifier(req.body?.description || '');
      return res.json(fallback);
    }
  }
}

export const aiController = new AIController();
