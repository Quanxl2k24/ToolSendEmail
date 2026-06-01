import { Worker } from "bullmq";
import prisma from "../../core/database/prisma.service.js";
import { sendEmail } from "../mail/mail.service.js";
import { emitProgressUpdate } from "../websockets/events.gateway.js";
import { logger } from "../../core/utils/logger.js";
import { getRedisConnection, EMAIL_QUEUE_NAME } from "./queue.config.js";
/**
 * queue.worker.ts
 *
 * The core engine of the email sending system.
 * This file can be run as a separate process or container for horizontal scaling:
 *   node --loader tsx src/modules/queue/queue.worker.ts
 *
 * BullMQ Rate Limiting: 10 jobs per second (prevents ESP from blocking our IP).
 * The limiter is set on the Queue itself in queue.producer.ts but enforced here.
 */
let worker = null;
export const startEmailWorker = () => {
    if (worker)
        return;
    worker = new Worker(EMAIL_QUEUE_NAME, async (job) => {
        const { logId, campaignId, to, subject, html, recipientName } = job.data;
        // ── Step 1: Check if campaign has been cancelled ──────────────────────
        const campaign = await prisma.campaign.findUnique({
            where: { id: campaignId },
            select: { status: true },
        });
        if (!campaign || campaign.status === "CANCELLED") {
            // Mark this log as cancelled and skip sending
            await prisma.mailLog.update({
                where: { id: logId },
                data: { status: "CANCELLED" },
            });
            logger.info(`Job skipped (campaign cancelled)`, { logId, campaignId });
            return; // Job completed silently - no error, no retry
        }
        // ── Step 2: Send the email ─────────────────────────────────────────────
        const sendOptions = {
            to,
            subject,
            html,
        };
        if (recipientName !== undefined)
            sendOptions.recipientName = recipientName;
        const { awsMessageId } = await sendEmail(sendOptions);
        // ── Step 3: Update MailLog as SENT ────────────────────────────────────
        await prisma.mailLog.update({
            where: { id: logId },
            data: {
                status: "SENT",
                awsMessageId,
                sentAt: new Date(),
            },
        });
        logger.info(`Email sent`, { logId, to, awsMessageId });
    }, {
        connection: getRedisConnection(),
        concurrency: 5, // Xử lý 5 job song song cùng lúc
        limiter: {
            max: 14, // Tối đa 14 jobs (AWS SES)
            duration: 1000, // mỗi 1000ms (1 giây)
        },
    });
    // ── Event: Job completed ────────────────────────────────────────────────
    worker.on("completed", async (job) => {
        const { campaignId } = job.data;
        try {
            // Tăng sent_count trong Campaign
            const updated = await prisma.campaign.update({
                where: { id: campaignId },
                data: { sentCount: { increment: 1 } },
                select: { sentCount: true, failedCount: true, totalEmails: true, status: true },
            });
            // Kiểm tra xem chiến dịch đã hoàn thành chưa
            const isDone = updated.sentCount + updated.failedCount >= updated.totalEmails;
            if (isDone && updated.status === "PROCESSING") {
                await prisma.campaign.update({
                    where: { id: campaignId },
                    data: { status: "COMPLETED" },
                });
            }
            // Bắn realtime progress lên client
            emitProgressUpdate(campaignId, {
                sent: updated.sentCount,
                failed: updated.failedCount,
                total: updated.totalEmails,
                status: isDone ? "COMPLETED" : "PROCESSING",
            });
        }
        catch (err) {
            logger.error("Failed to update campaign after job completion", { campaignId, err: String(err) });
        }
    });
    // ── Event: Job failed (after all retries exhausted) ─────────────────────
    worker.on("failed", async (job, err) => {
        if (!job)
            return;
        const { logId, campaignId } = job.data;
        try {
            await prisma.mailLog.update({
                where: { id: logId },
                data: { status: "FAILED", errorMessage: err.message },
            });
            const updated = await prisma.campaign.update({
                where: { id: campaignId },
                data: { failedCount: { increment: 1 } },
                select: { sentCount: true, failedCount: true, totalEmails: true, status: true },
            });
            const isDone = updated.sentCount + updated.failedCount >= updated.totalEmails;
            if (isDone && updated.status === "PROCESSING") {
                await prisma.campaign.update({
                    where: { id: campaignId },
                    data: { status: "COMPLETED" },
                });
            }
            emitProgressUpdate(campaignId, {
                sent: updated.sentCount,
                failed: updated.failedCount,
                total: updated.totalEmails,
                status: isDone ? "COMPLETED" : "PROCESSING",
            });
            logger.error("Email job failed permanently", { logId, campaignId, error: err.message });
        }
        catch (dbErr) {
            logger.error("Failed to update DB after job failure", { campaignId, dbErr: String(dbErr) });
        }
    });
    logger.info("Email Worker started.", { queue: EMAIL_QUEUE_NAME });
};
//# sourceMappingURL=queue.worker.js.map