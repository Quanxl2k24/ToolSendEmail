import { Server as SocketIOServer, type Socket } from "socket.io";
import type { Server as HttpServer } from "http";
import { logger } from "../../core/utils/logger.js";

/**
 * events.gateway.ts
 *
 * Socket.io gateway for real-time progress updates.
 *
 * Client usage:
 *   const socket = io("http://localhost:3000");
 *   socket.emit("join_campaign", "campaign_uuid_here");
 *   socket.on("progress_update", (data) => {
 *     console.log(data); // { sent, failed, total, status }
 *   });
 */

export interface ProgressPayload {
  sent: number;
  failed: number;
  total: number;
  status: string;
}

let io: SocketIOServer | null = null;

/**
 * Initialize Socket.io with the HTTP server.
 * Call this once in app.ts before starting to listen.
 */
export const initSocketGateway = (httpServer: HttpServer): SocketIOServer => {
  if (io) return io;

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL ?? "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket: Socket) => {
    logger.info("Socket connected", { socketId: socket.id });

    // Client joins a campaign room to receive progress updates for that specific campaign
    socket.on("join_campaign", (campaignId: string) => {
      socket.join(`campaign_${campaignId}`);
      logger.info("Socket joined campaign room", {
        socketId: socket.id,
        campaignId,
      });
    });

    socket.on("leave_campaign", (campaignId: string) => {
      socket.leave(`campaign_${campaignId}`);
    });

    socket.on("disconnect", () => {
      logger.info("Socket disconnected", { socketId: socket.id });
    });
  });

  logger.info("Socket.io gateway initialized.");
  return io;
};

/**
 * Emit a progress update to all clients in a campaign's room.
 * Called by the queue worker after each job completes or fails.
 */
export const emitProgressUpdate = (
  campaignId: string,
  payload: ProgressPayload,
): void => {
  if (!io) {
    logger.warn("Socket.io not initialized, skipping emit", { campaignId });
    return;
  }
  io.to(`campaign_${campaignId}`).emit("progress_update", payload);
};

export { io };
