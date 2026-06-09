import { Worker, type Job } from "bullmq";
import prisma from "../../core/database/prisma.service.js";
import { sendEmail } from "../mail/mail.service.js";
import { emitProgressUpdate } from "../websockets/events.gateway.js";
import { logger } from "../../core/utils/logger.js";
import { getRedisConnection, EMAIL_QUEUE_NAME } from "./queue.config.js";
import type { EmailJobData } from "./queue.producer.js";
import { getAccessToken } from "../auth/token.service.js";
import { updateSheetCellStatus } from "../../core/utils/googleSheetsWriter.util.js";

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

let worker: Worker<EmailJobData> | null = null;

export const startEmailWorker = (): void => {
  if (worker) return;

  worker = new Worker<EmailJobData>(
    EMAIL_QUEUE_NAME,
    async (job: Job<EmailJobData>) => {
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
      const sendOptions: { to: string; subject: string; html: string; recipientName?: string } = {
        to,
        subject,
        html,
      };
      if (recipientName !== undefined) sendOptions.recipientName = recipientName;

      const { messageId } = await sendEmail(sendOptions);

      // ── Step 3: Update MailLog as SENT ────────────────────────────────────
      await prisma.mailLog.update({
        where: { id: logId },
        data: {
          status: "SENT",
          messageId,
          sentAt: new Date(),
        },
      });

      // ── Step 4: Update Google Sheet status (nếu có) ───────────────────────
      const { sheetUpdateInfo } = job.data;
      if (sheetUpdateInfo) {
        try {
          const camp = await prisma.campaign.findUnique({
            where: { id: campaignId },
            select: { createdBy: true },
          });
          if (camp) {
            const token = await getAccessToken(camp.createdBy);
            await updateSheetCellStatus(
              sheetUpdateInfo.spreadsheetId,
              sheetUpdateInfo.sheetName,
              token,
              sheetUpdateInfo.rowIndex,
              "SENT",
            );
          }
        } catch (sheetErr) {
          logger.warn("Failed to update sheet status", {
            logId,
            campaignId,
            err: String(sheetErr),
          });
        }
      }

      logger.info(`Email sent`, { logId, to, messageId });
    },
    {
      connection: getRedisConnection(),
      concurrency: 1, // Chỉ 1 job tại 1 thời điểm (tránh Gmail 429)
      limiter: {
        max: Number(process.env.SMTP_RATE_LIMIT ?? 15),
        duration: 60000, // 15 email mỗi phút
      },
    },
  );

  // ── Event: Job completed ────────────────────────────────────────────────
  worker.on("completed", async (job: Job<EmailJobData>) => {
    const { logId, campaignId } = job.data;
    try {
      // Kiểm tra nếu mail bị hủy (campaign cancelled)
      const mailLog = await prisma.mailLog.findUnique({
        where: { id: logId },
        select: { status: true },
      });

      if (mailLog?.status === "CANCELLED") {
        // Không tăng sentCount, chỉ kiểm tra hoàn tất
        const [campaign, cancelledCount] = await Promise.all([
          prisma.campaign.findUnique({
            where: { id: campaignId },
            select: { sentCount: true, failedCount: true, totalEmails: true, status: true },
          }),
          prisma.mailLog.count({
            where: { campaignId, status: "CANCELLED" },
          }),
        ]);

        if (campaign && campaign.status === "PROCESSING") {
          const totalProcessed = campaign.sentCount + campaign.failedCount + cancelledCount;
          if (totalProcessed >= campaign.totalEmails) {
            const newStatus = campaign.sentCount > 0 ? "COMPLETED" : "FAILED";
            await prisma.campaign.update({
              where: { id: campaignId },
              data: { status: newStatus },
            });
            emitProgressUpdate(campaignId, {
              sent: campaign.sentCount,
              failed: campaign.failedCount,
              total: campaign.totalEmails,
              status: newStatus,
            });
          }
        }
        return;
      }

      // Tăng sent_count trong Campaign (mail gửi thành công)
      const updated = await prisma.campaign.update({
        where: { id: campaignId },
        data: { sentCount: { increment: 1 } },
        select: { sentCount: true, failedCount: true, totalEmails: true, status: true },
      });

      // Đếm số mail bị hủy để tính điều kiện hoàn tất
      const cancelledCount = await prisma.mailLog.count({
        where: { campaignId, status: "CANCELLED" },
      });

      const totalProcessed = updated.sentCount + updated.failedCount + cancelledCount;
      const isDone = totalProcessed >= updated.totalEmails;
      if (isDone && updated.status === "PROCESSING") {
        const newStatus = updated.sentCount > 0 ? "COMPLETED" : "FAILED";
        await prisma.campaign.update({
          where: { id: campaignId },
          data: { status: newStatus },
        });
      }

      // Bắn realtime progress lên client
      emitProgressUpdate(campaignId, {
        sent: updated.sentCount,
        failed: updated.failedCount,
        total: updated.totalEmails,
        status: isDone ? (updated.sentCount > 0 ? "COMPLETED" : "FAILED") : "PROCESSING",
      });
    } catch (err) {
      logger.error("Failed to update campaign after job completion", { campaignId, err: String(err) });
    }
  });

  // ── Event: Job failed (permanently, after all retries exhausted) ────────
  worker.on("failed", async (job: Job<EmailJobData> | undefined, err: Error) => {
    if (!job) return;

    // Chỉ xử lý khi hết retry, bỏ qua các lần thất bại tạm thời
    const isPermanent = job.attemptsMade >= (job.opts.attempts ?? 1);
    if (!isPermanent) {
      logger.warn("Email job failed, will retry", {
        logId: job.data.logId,
        campaignId: job.data.campaignId,
        attempt: job.attemptsMade,
      });
      return;
    }

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

      const cancelledCount = await prisma.mailLog.count({
        where: { campaignId, status: "CANCELLED" },
      });

      const totalProcessed = updated.sentCount + updated.failedCount + cancelledCount;
      const isDone = totalProcessed >= updated.totalEmails;
      if (isDone && updated.status === "PROCESSING") {
        const newStatus = updated.sentCount > 0 ? "COMPLETED" : "FAILED";
        await prisma.campaign.update({
          where: { id: campaignId },
          data: { status: newStatus },
        });
      }

      emitProgressUpdate(campaignId, {
        sent: updated.sentCount,
        failed: updated.failedCount,
        total: updated.totalEmails,
        status: isDone ? (updated.sentCount > 0 ? "COMPLETED" : "FAILED") : "PROCESSING",
      });

      logger.error("Email job failed permanently", { logId, campaignId, error: err.message });
    } catch (dbErr) {
      logger.error("Failed to update DB after job failure", { campaignId, dbErr: String(dbErr) });
    }
  });

  logger.info("Email Worker started.", { queue: EMAIL_QUEUE_NAME });
};
