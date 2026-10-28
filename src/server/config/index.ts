import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'aapda_matrix_default_secret_key_change_in_prod',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  uploadDir: process.env.UPLOAD_DIR || path.resolve(process.cwd(), 'uploads/audio'),
  nodeEnv: process.env.NODE_ENV || 'development',
};
