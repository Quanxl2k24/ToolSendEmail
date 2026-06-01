import { Server as SocketIOServer } from "socket.io";
import type { Server as HttpServer } from "http";
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
declare let io: SocketIOServer | null;
/**
 * Initialize Socket.io with the HTTP server.
 * Call this once in app.ts before starting to listen.
 */
export declare const initSocketGateway: (httpServer: HttpServer) => SocketIOServer;
/**
 * Emit a progress update to all clients in a campaign's room.
 * Called by the queue worker after each job completes or fails.
 */
export declare const emitProgressUpdate: (campaignId: string, payload: ProgressPayload) => void;
export { io };
//# sourceMappingURL=events.gateway.d.ts.map