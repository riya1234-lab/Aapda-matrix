import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Generates a valid 3-second 440Hz/880Hz emergency radio pulse WAV file
function createWavBuffer(durationSeconds = 3, sampleRate = 8000): Buffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const numSamples = durationSeconds * sampleRate;
  const dataSize = numSamples * (bitsPerSample / 8);
  const headerSize = 44;
  const buffer = Buffer.alloc(headerSize + dataSize);

  // RIFF Chunk
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // FMT Chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  // DATA Chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Generate synthetic emergency radio pulse tone (intermittent beep)
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Intermittent pulse tone: 0.5s beep at 800Hz, 0.2s pause
    const isBeep = Math.floor(t * 2) % 2 === 0;
    const freq = isBeep ? 880 : 0;
    const sample = freq > 0 ? Math.sin(2 * Math.PI * freq * t) * 0.4 * 32767 : 0;
    buffer.writeInt16LE(Math.floor(sample), headerSize + i * 2);
  }

  return buffer;
}

async function main() {
  const uploadDir = path.resolve(__dirname, '../uploads/audio');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const fileName = 'demo_emergency_voice_log.wav';
  const filePath = path.join(uploadDir, fileName);
  const wavBuffer = createWavBuffer(4, 8000);
  fs.writeFileSync(filePath, wavBuffer);
  console.log(`✓ Sample emergency audio file created at: ${filePath} (${wavBuffer.length} bytes)`);

  // Link to SOS_8F3A29
  const incident8F = await prisma.incident.findUnique({ where: { id: 'SOS_8F3A29' } });
  if (incident8F) {
    const existing = await prisma.incidentAttachment.findFirst({
      where: { incidentId: 'SOS_8F3A29', attachmentType: 'AUDIO_VOICE' },
    });
    if (!existing) {
      await prisma.incidentAttachment.create({
        data: {
          id: 'att_demo_voice_8f3a29',
          incidentId: 'SOS_8F3A29',
          attachmentType: 'AUDIO_VOICE',
          secureStorageReference: fileName,
          mimeType: 'audio/wav',
          fileSize: wavBuffer.length,
          durationSeconds: 4,
        },
      });
      console.log('✓ Linked audio attachment to SOS_8F3A29');
    }
  }

  // Link to SOS_14D98E
  const incident14D = await prisma.incident.findUnique({ where: { id: 'SOS_14D98E' } });
  if (incident14D) {
    const existing = await prisma.incidentAttachment.findFirst({
      where: { incidentId: 'SOS_14D98E', attachmentType: 'AUDIO_VOICE' },
    });
    if (!existing) {
      await prisma.incidentAttachment.create({
        data: {
          id: 'att_demo_voice_14d98e',
          incidentId: 'SOS_14D98E',
          attachmentType: 'AUDIO_VOICE',
          secureStorageReference: fileName,
          mimeType: 'audio/wav',
          fileSize: wavBuffer.length,
          durationSeconds: 4,
        },
      });
      console.log('✓ Linked audio attachment to SOS_14D98E');
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
