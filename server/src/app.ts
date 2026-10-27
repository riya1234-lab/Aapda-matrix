import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';

import incidentRoutes from './routes/incidentRoutes';
import aiRoutes from './routes/aiRoutes';
import contactRoutes from './routes/contactRoutes';
import teamRoutes from './routes/teamRoutes';
import authRoutes from './routes/authRoutes';
import healthRoutes from './routes/healthRoutes';

export const app = express();

// Security & Cross-Origin
app.use(
  cors({
    origin: '*', // Allow client connections
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsers
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Rate limiter for general endpoints (exclude emergency SOS creation to never block distress calls)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', generalLimiter);

// API Route Mounts
app.use('/api/incidents', incidentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/emergency-contacts', contactRoutes);
app.use('/api/response-teams', teamRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/health', healthRoutes);

// Error Handler Middleware
app.use(errorHandler);

export default app;
