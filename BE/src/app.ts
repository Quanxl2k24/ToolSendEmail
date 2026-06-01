import "dotenv/config";
import express from "express";
import http from "http";
import cors from "cors";

// Core
import { setupSwagger } from "./core/config/swagger.js";
import { globalErrorHandler } from "./core/middlewares/errorHandler.middleware.js";
import { AppError } from "./core/exceptions/appError.js";

// Modules
import campaignsRouter from "./modules/campaigns/campaigns.controller.js";
import webhooksRouter from "./modules/mail/webhooks.controller.js";
import authRouter from "./modules/auth/auth.controller.js";

// WebSockets
import { initSocketGateway } from "./modules/websockets/events.gateway.js";

// Queue Worker
import { startEmailWorker } from "./modules/queue/queue.worker.js";

const app = express();
const server = http.createServer(app);

// ── Middlewares ────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL ?? "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Initialize Socket.io ───────────────────────────────────────────────────
initSocketGateway(server);

// ── Initialize Email Worker ────────────────────────────────────────────────
// Worker runs in the same process in development.
// In production, run queue.worker.ts as a separate process/container.
startEmailWorker();

// ── Routes ─────────────────────────────────────────────────────────────────
app.use("/api/auth", authRouter);
app.use("/api/campaigns", campaignsRouter);
app.use("/api/webhooks", webhooksRouter);

// ── API Documentation ──────────────────────────────────────────────────────
setupSwagger(app);

// ── 404 Handler ───────────────────────────────────────────────────────────
app.all("/*splat", (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server.`, 404));
});

// ── Global Error Handler (must be last) ───────────────────────────────────
app.use(globalErrorHandler);

// ── Start Server ───────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT ?? 3000);
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📄 API Docs: http://localhost:${PORT}/api-docs`);
});
