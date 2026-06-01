import { Server as SocketIOServer } from "socket.io";
import { logger } from "../../core/utils/logger.js";
let io = null;
/**
 * Initialize Socket.io with the HTTP server.
 * Call this once in app.ts before starting to listen.
 */
export const initSocketGateway = (httpServer) => {
    if (io)
        return io;
    io = new SocketIOServer(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL ?? "*",
            methods: ["GET", "POST"],
        },
    });
    io.on("connection", (socket) => {
        logger.info("Socket connected", { socketId: socket.id });
        // Client joins a campaign room to receive progress updates for that specific campaign
        socket.on("join_campaign", (campaignId) => {
            socket.join(`campaign_${campaignId}`);
            logger.info("Socket joined campaign room", {
                socketId: socket.id,
                campaignId,
            });
        });
        socket.on("leave_campaign", (campaignId) => {
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
export const emitProgressUpdate = (campaignId, payload) => {
    if (!io) {
        logger.warn("Socket.io not initialized, skipping emit", { campaignId });
        return;
    }
    io.to(`campaign_${campaignId}`).emit("progress_update", payload);
};
export { io };
//# sourceMappingURL=events.gateway.js.map