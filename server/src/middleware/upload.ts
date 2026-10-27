import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';

// Ensure upload directory exists
if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.webm';
    const uniqueKey = `audio_${Date.now()}_${uuidv4().substring(0, 8)}${ext}`;
    cb(null, uniqueKey);
  },
});

export const uploadAudio = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB maximum
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      'audio/webm',
      'audio/ogg',
      'audio/wav',
      'audio/mpeg',
      'audio/mp4',
      'audio/aac',
      'audio/x-m4a',
      'application/octet-stream', // often sent by mobile browsers recording audio
    ];
    if (allowedMimes.includes(file.mimetype) || file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid audio format: ${file.mimetype}`));
    }
  },
});
