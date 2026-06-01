import { io, Socket } from 'socket.io-client';
import type { ProgressUpdate } from '../types';

const DEFAULT_BASE_URL = 'http://localhost:3000';

let socket: Socket | null = null;

function getBaseUrl(): string {
  return import.meta.env.VITE_API_URL ?? DEFAULT_BASE_URL;
}

export function connectSocket(token: string): Socket {
  if (socket?.connected) return socket;

  socket = io(getBaseUrl(), {
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.error('[Socket] Connection error:', err.message);
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function joinCampaign(campaignId: string): void {
  socket?.emit('join_campaign', campaignId);
}

export function leaveCampaign(campaignId: string): void {
  socket?.emit('leave_campaign', campaignId);
}

export function onProgressUpdate(callback: (data: ProgressUpdate) => void): () => void {
  socket?.on('progress_update', callback);
  return () => {
    socket?.off('progress_update', callback);
  };
}

export function getSocket(): Socket | null {
  return socket;
}
