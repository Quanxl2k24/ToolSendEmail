import { Queue, Worker } from "bullmq";
import prisma from "../../core/database/prisma.service.js";
import { logger } from "../../core/utils/logger.js";
import { getRedisConnection } from "../queue/queue.config.js";
import { getAccessToken } from "../auth/token.service.js";
import { parseGoogleSheet, parseGoogleSheetUrl } from "../../core/utils/googleSheets.util.js";
import { ensureStatusColumn } from "../../core/utils/googleSheetsWriter.util.js";
import { updateCampaignStatus } from "./campaigns.repository.js";
import { addBulkEmailJobs } from "../queue/queue.producer.js";
import { renderTemplate } from "./campaigns.service.js";

const WATCHER_QUEUE = "campaign-watcher";

let watcherQueue: Queue | null = null;
let watcherWorker: Worker | null = null;

function getWatcherQueue(): Queue {
  if (watcherQueue) return watcherQueue;
  watcherQueue = new Queue(WATCHER_QUEUE, {
    connection: getRedisConnection(),
  });
  return watcherQueue;
}

async function activatePendingCampaigns() {
  const now = new Date();
  const pending = await prisma.campaign.findMany({
    where: {
      type: "SCHEDULED",
      status: "PENDING",
      startTime: { lte: now },
    },
  });

  for (const campaign of pending) {
    await updateCampaignStatus(campaign.id, "PROCESSING");
    logger.info("Scheduled campaign activated", { campaignId: campaign.id });
  }
}

async function completeExpiredCampaigns() {
  const now = new Date();
  const expired = await prisma.campaign.findMany({
    where: {
      type: "SCHEDULED",
      status: "PROCESSING",
      endTime: { lt: now },
    },
  });

  for (const campaign of expired) {
    await updateCampaignStatus(campaign.id, "COMPLETED");
    logger.info("Scheduled campaign completed (endTime passed)", { campaignId: campaign.id });
  }
}

async function scanAndSend(campaign: {
  id: string;
  googleSheetUrl: string | null;
  sheetName: string | null;
  sheetId: number | null;
  subject: string;
  htmlBody: string;
  emailColumn?: string | null;
  createdBy: string;
}) {
  if (!campaign.googleSheetUrl || !campaign.sheetName) return;

  const { spreadsheetId } = parseGoogleSheetUrl(campaign.googleSheetUrl);
  if (!spreadsheetId) return;

  const accessToken = await getAccessToken(campaign.createdBy);

  const result = await parseGoogleSheet(campaign.googleSheetUrl, accessToken);
  const rows = result.rows;

  await ensureStatusColumn(spreadsheetId, campaign.sheetName, accessToken);

  const existingLogs = await prisma.mailLog.findMany({
    where: { campaignId: campaign.id, rowIndex: { not: null } },
    select: { rowIndex: true, status: true },
  });

  const completedRowIndices = new Set(
    existingLogs
      .filter((l) => l.status === "SENT" || l.status === "FAILED")
      .map((l) => l.rowIndex)
  );
  const queuedLogsByRow = new Map(
    existingLogs
      .filter((l) => l.status === "QUEUED")
      .map((l) => [l.rowIndex, l])
  );

  const rawStringRows: Record<string, string>[] = rows.map((r: any) =>
    Object.fromEntries(Object.entries(r).map(([k, v]) => [k, String(v ?? "")]))
  );

  const pendingRows: { rowIndex: number; row: Record<string, string> }[] = [];
  for (let i = 0; i < rows.length; i++) {
    if (!completedRowIndices.has(i)) {
      pendingRows.push({ rowIndex: i, row: rows[i] as Record<string, string> });
    }
  }

  const sampleRow = rows[0] || {};
  logger.info("Watcher: scan result", {
    campaignId: campaign.id,
    totalRows: rows.length,
    completedRows: completedRowIndices.size,
    pendingRows: pendingRows.length,
    sheetHeaders: Object.keys(sampleRow),
    pendingEmails: pendingRows.map((r) => {
      let foundEmail = "N/A";
      for (const key in r.row) {
        const lowerKey = key.trim().toLowerCase();
        if (lowerKey === "email" || lowerKey === "thư điện tử" || lowerKey === "e-mail") {
          foundEmail = r.row[key]!;
          break;
        }
      }
      return { row: r.rowIndex, email: foundEmail };
    }),
  });

  if (pendingRows.length === 0) {
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { lastScannedAt: new Date() },
    });
    return;
  }

  const contacts: { email: string; name?: string }[] = [];
  const contactRowIndices: number[] = [];
  const contactRows: Record<string, string>[] = [];

  for (const { rowIndex, row } of pendingRows) {
    const rawRow = rawStringRows[rowIndex]!;
    let email = "";
    let name = "";
    for (const key in rawRow) {
      const lowerKey = key.trim().toLowerCase();
      if (lowerKey === "email" || lowerKey === "thư điện tử" || lowerKey === "e-mail") {
        email = rawRow[key]!;
      }
      if (lowerKey === "name" || lowerKey === "tên" || lowerKey === "họ tên" || lowerKey === "họ và tên") {
        name = rawRow[key]!;
      }
    }
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (name) {
        contacts.push({ email, name });
      } else {
        contacts.push({ email });
      }
      contactRowIndices.push(rowIndex);
      contactRows.push(rawRow);
    }
  }

  if (contacts.length === 0) {
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { lastScannedAt: new Date() },
    });
    return;
  }

  // Create new mailLogs only for rows that don't have any existing log
  const newContactRowIndices = contactRowIndices.filter((r) => !queuedLogsByRow.has(r));
  if (newContactRowIndices.length > 0) {
    const newContacts = contacts.filter((_, i) => !queuedLogsByRow.has(contactRowIndices[i]!));
    await prisma.mailLog.createMany({
      data: newContacts.map((c, i) => ({
        campaignId: campaign.id,
        recipientEmail: c.email,
        recipientName: c.name ?? null,
        rowIndex: newContactRowIndices[i] ?? null,
        status: "QUEUED",
      })),
      skipDuplicates: false,
    });
  }

  // Get all QUEUED logs for pending rows (both newly created and retried)
  const allQueuedLogs = await prisma.mailLog.findMany({
    where: {
      campaignId: campaign.id,
      rowIndex: { in: contactRowIndices },
      status: "QUEUED",
    },
    select: { id: true, recipientEmail: true, recipientName: true, rowIndex: true },
  });

  const rowIndexToLog = new Map(allQueuedLogs.map((l) => [l.rowIndex, l]));

  const jobs = contactRowIndices.map((rowIdx, i) => {
    const log = rowIndexToLog.get(rowIdx);
    if (!log) return null;
    const row = contactRows[i] ?? {};
    const job: import("../queue/queue.producer.js").EmailJobData = {
      logId: log.id,
      campaignId: campaign.id,
      to: log.recipientEmail,
      subject: renderTemplate(campaign.subject, row),
      html: renderTemplate(campaign.htmlBody, row),
    };
    if (log.recipientName) {
      job.recipientName = log.recipientName;
    }
    job.sheetUpdateInfo = {
      spreadsheetId,
      sheetName: campaign.sheetName!,
      rowIndex: rowIdx,
    };
    return job;
  });

  const validJobs = jobs.filter((j): j is NonNullable<typeof j> => j != null);
  const jobsAdded = await addBulkEmailJobs(validJobs);

  await prisma.campaign.update({
    where: { id: campaign.id },
    data: {
      totalEmails: { increment: newContactRowIndices.length },
      lastScannedAt: new Date(),
    },
  });

  logger.info("Watcher: emails queued from sheet", {
    campaignId: campaign.id,
    newContacts: newContactRowIndices.length,
    retriedContacts: contactRowIndices.length - newContactRowIndices.length,
    jobsAdded,
  });
}

async function processScan() {
  const now = new Date();

  await activatePendingCampaigns();

  const activeCampaigns = await prisma.campaign.findMany({
    where: {
      type: "SCHEDULED",
      status: "PROCESSING",
      startTime: { lte: now },
      endTime: { gte: now },
      googleSheetUrl: { not: null },
    },
  });

  for (const campaign of activeCampaigns) {
    try {
      await scanAndSend(campaign);
    } catch (err) {
      logger.error("Watcher: failed to scan campaign", {
        campaignId: campaign.id,
        err: String(err),
      });
    }
  }

  await completeExpiredCampaigns();
}

export const startCampaignWatcher = async (): Promise<void> => {
  if (watcherWorker) return;

  const queue = getWatcherQueue();

  await queue.upsertJobScheduler("scan-scheduled-campaigns", {
    every: 300_000,
    immediately: false,
  });

  watcherWorker = new Worker(
    WATCHER_QUEUE,
    async () => {
      logger.info("Watcher: scanning scheduled campaigns...");
      await processScan();
    },
    {
      connection: getRedisConnection(),
      concurrency: 1,
    },
  );

  watcherWorker.on("completed", () => {
    logger.info("Watcher: scan completed");
  });

  watcherWorker.on("failed", (_job, err) => {
    logger.error("Watcher: scan failed", { err: String(err) });
  });

  logger.info("Campaign watcher started (every 5 minutes)");
};
