import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on('connect', () => {
      console.log('⚡ Connected to AAPDA MATRIX Socket Gateway:', socket?.id);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Disconnected from AAPDA MATRIX Socket Gateway');
    });
  }

  return socket;
}
