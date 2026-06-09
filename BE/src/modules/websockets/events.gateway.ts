import { Server as SocketIOServer, type Socket } from "socket.io";
import type { Server as HttpServer } from "http";
import { verifyJwt } from "../../core/utils/jwt.util.js";
import { logger } from "../../core/utils/logger.js";

/**
 * events.gateway.ts
 *
 * Socket.io gateway for real-time progress updates.
 *
 * Client usage:
 *   const socket = io("http://localhost:3000", { auth: { token } });
 *   socket.emit("join_campaign", "campaign_uuid_here");
 *   socket.on("progress_update", (data) => { ... });
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
 * Authenticates connections via JWT from socket handshake auth.
 */
export const initSocketGateway = (httpServer: HttpServer): SocketIOServer => {
  if (io) return io;

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL ?? "*",
      methods: ["GET", "POST"],
    },
  });

  // Authenticate socket connections via JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      return next(new Error("Missing authentication token."));
    }

    // Mock mode for development
    if (token.startsWith("mock_")) {
      (socket as any).userEmail = token.split("_")[1] || "dev-user@example.com";
      return next();
    }

    try {
      const payload = verifyJwt(token);
      (socket as any).userEmail = payload.email;
      next();
    } catch {
      next(new Error("Invalid or expired token."));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userEmail = (socket as any).userEmail as string;
    logger.info("Socket connected", { socketId: socket.id, userEmail });

    socket.on("join_campaign", (campaignId: string) => {
      socket.join(`campaign_${campaignId}`);
      logger.info("Socket joined campaign room", {
        socketId: socket.id,
        campaignId,
        userEmail,
      });
    });

    socket.on("leave_campaign", (campaignId: string) => {
      socket.leave(`campaign_${campaignId}`);
    });

    socket.on("disconnect", () => {
      logger.info("Socket disconnected", { socketId: socket.id, userEmail });
    });
  });

  logger.info("Socket.io gateway initialized.");
  return io;
};

/**
 * Emit a progress update to all clients in a campaign's room.
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
