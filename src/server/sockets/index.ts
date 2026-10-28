import { Server, Socket } from 'socket.io';

let ioInstance: Server | null = null;

export function initSocketIO(io: Server) {
  ioInstance = io;

  io.on('connection', (socket: Socket) => {
    console.log(`⚡ Socket client connected: ${socket.id}`);

    // Join Command Center channel
    socket.on('join:command_center', () => {
      socket.join('command_center');
      console.log(`🛡️ Client ${socket.id} joined Command Center operations stream`);
    });

    // Join specific incident tracking channel (victim or assigned responder)
    socket.on('join:incident', (incidentId: string) => {
      if (incidentId) {
        socket.join(`incident:${incidentId}`);
        console.log(`📍 Client ${socket.id} joined tracking channel for ${incidentId}`);
      }
    });

    // Handle ping/liveness
    socket.on('ping:mesh', (data: { deviceId: string; battery: number }) => {
      io.to('command_center').emit('telemetry:mesh_ping', {
        deviceId: data.deviceId,
        battery: data.battery,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket client disconnected: ${socket.id}`);
    });
  });
}

export function getIO(): Server {
  if (!ioInstance) {
    throw new Error('Socket.IO has not been initialized');
  }
  return ioInstance;
}

// Broadcast new incident to Command Center
export function broadcastNewIncident(incident: any) {
  if (ioInstance) {
    ioInstance.to('command_center').emit('incident:new', incident);
  }
}

// Broadcast incident status change to both Command Center and victim
export function broadcastIncidentUpdate(incident: any) {
  if (ioInstance) {
    ioInstance.to('command_center').emit('incident:updated', incident);
    ioInstance.to(`incident:${incident.id}`).emit('incident:updated', incident);
  }
}

// Broadcast live location update
export function broadcastLocationUpdate(incidentId: string, locationData: any) {
  if (ioInstance) {
    ioInstance.to('command_center').emit('incident:location', { incidentId, ...locationData });
    ioInstance.to(`incident:${incidentId}`).emit('incident:location', locationData);
  }
}

// Broadcast audio upload attachment
export function broadcastAudioUploaded(incidentId: string, attachment: any) {
  if (ioInstance) {
    ioInstance.to('command_center').emit('incident:audio_added', { incidentId, attachment });
    ioInstance.to(`incident:${incidentId}`).emit('incident:audio_added', attachment);
  }
}

// Broadcast high-priority dispatch alert to victim ("Help is on the way")
export function broadcastDispatchAlert(incidentId: string, alertData: any) {
  if (ioInstance) {
    ioInstance.to('command_center').emit('incident:dispatched', alertData);
    ioInstance.to(`incident:${incidentId}`).emit('incident:dispatched', alertData);
    ioInstance.emit('incident:dispatched', alertData);
  }
}

