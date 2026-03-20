import { Server } from 'socket.io';

let io: Server | null = null;

export const setIO = (socketIO: Server) => { io = socketIO; };

export const getIO = (): Server => {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
};
