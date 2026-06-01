import { Router } from "express";
import prisma from "../../core/database/prisma.service.js";
import { logger } from "../../core/utils/logger.js";
import asyncCatch from "../../core/middlewares/asyncCatch.middleware.js";
/**
 * webhooks.controller.ts
 *
 * Receives callback events from ESP (SendGrid, Resend, etc.) and updates
 * the MailLog status accordingly.
 *
 * Configure your ESP to POST events to: POST /api/webhooks/mail-status
 *
 * The webhook payload format below is generic. Adapt to match your ESP's format.
 */
const router = Router();
/**
 * @openapi
 * /api/webhooks/mail-status:
 *   post:
 *     summary: Receive email status callbacks from ESP
 *     description: Called by SendGrid/Resend/etc. to report delivery, bounce, or open events.
 *     tags:
 *       - Webhooks
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *     responses:
 *       200:
 *         description: Events processed successfully
 */
router.post("/mail-status", asyncCatch(async (req, res) => {
    const events = Array.isArray(req.body)
        ? req.body
        : [req.body];
    for (const event of events) {
        if (!event.messageId)
            continue;
        const statusMap = {
            delivered: "DELIVERED",
            bounce: "BOUNCED",
            open: "OPENED",
        };
        const newStatus = statusMap[event.event];
        if (!newStatus)
            continue;
        await prisma.mailLog.updateMany({
            where: { awsMessageId: event.messageId },
            data: { status: newStatus },
        });
        logger.info("Webhook processed", { messageId: event.messageId, event: event.event });
    }
    res.status(200).json({ success: true, processed: events.length });
}));
export default router;
//# sourceMappingURL=webhooks.controller.js.map