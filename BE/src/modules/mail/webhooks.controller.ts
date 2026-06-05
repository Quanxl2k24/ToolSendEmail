import { Router } from "express";
import type { Request, Response } from "express";
import prisma from "../../core/database/prisma.service.js";
import { logger } from "../../core/utils/logger.js";
import asyncCatch from "../../core/middlewares/asyncCatch.middleware.js";

/**
 * webhooks.controller.ts
 *
 * GHI CHÚ: Gmail SMTP KHÔNG hỗ trợ webhook delivery/bounce/open tracking.
 * Nếu sau này chuyển sang ESP có webhook (SendGrid, Resend, AWS SES...),
 * hãy kích hoạt lại route này và cập nhật format payload tương ứng.
 *
 * Cấu trúc payload mẫu (cần adapt theo ESP cụ thể):
 *   POST /api/webhooks/mail-status
 *   Body: [{ messageId: "...", event: "delivered" | "bounce" | "open" }]
 */

const router = Router();

interface WebhookEvent {
  messageId: string;
  event: "delivered" | "bounce" | "open" | "click" | "spam";
  email?: string;
  timestamp?: number;
}

/**
 * @openapi
 * /api/webhooks/mail-status:
 *   post:
 *     summary: Receive email status callbacks from ESP
 *     description: (HIỆN ĐANG TẮT) Gmail SMTP không hỗ trợ webhook.
 *     tags:
 *       - Webhooks
 *     responses:
 *       200:
 *         description: Webhook endpoint is disabled
 */
router.post(
  "/mail-status",
  asyncCatch(async (req: Request, res: Response) => {
    logger.warn("Webhook endpoint hit but is disabled (Gmail SMTP doesn't support webhooks)");
    res.status(200).json({ success: true, processed: 0, message: "Webhooks disabled - using Gmail SMTP" });
  }),
);

export default router;
