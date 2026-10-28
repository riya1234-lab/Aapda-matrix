import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { app } from './app';
import { config } from './config';
import { initSocketIO } from './sockets';
import prisma from './models/prisma';

const server = http.createServer(app);

// Setup Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

initSocketIO(io);

server.listen(config.port, () => {
  console.log(`=================================================`);
  console.log(`🛡️ AAPDA MATRIX API & REAL-TIME SOCKET GATEWAY`);
  console.log(`📡 Listening on http://localhost:${config.port}`);
  console.log(`⚡ Environment: ${config.nodeEnv}`);
  console.log(`=================================================`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nGracefully shutting down AAPDA MATRIX Gateway...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('Server terminated.');
    process.exit(0);
  });
});
