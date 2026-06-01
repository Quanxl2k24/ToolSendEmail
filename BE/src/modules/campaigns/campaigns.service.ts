import {
  CreateCampaignSchema,
  ContactSchema,
  validateAndFilterContacts,
} from "./dto/campaign.schema.js";
import {
  createCampaign,
  bulkCreateMailLogs,
  getMailLogsForQueue,
  updateCampaignStatus,
  listCampaigns,
  findCampaignById,
} from "./campaigns.repository.js";
import { addBulkEmailJobs } from "../queue/queue.producer.js";
import { emitProgressUpdate } from "../websockets/events.gateway.js";
import { parseFileBuffer } from "../../core/utils/excel.util.js";
import { parseGoogleSheet, parseGoogleSheetUrl } from "../../core/utils/googleSheets.util.js";
import { batchUpdateSheetStatuses } from "../../core/utils/googleSheetsWriter.util.js";
import { AppError } from "../../core/exceptions/appError.js";
import { logger } from "../../core/utils/logger.js";
import { checkAndIncrementQuota } from "./quota.service.js";
import { upsertUserToken } from "../auth/token.service.js";
import prisma from "../../core/database/prisma.service.js";

function buildPreview(rows: Record<string, string>[]) {
  if (rows.length === 0) return { headers: [], rows: [], total: 0 };
  const headers = Object.keys(rows[0]!);
  const preview = rows.slice(0, 10);
  return { headers, rows: preview, total: rows.length };
}

export const previewFile = async (file: Express.Multer.File) => {
  const data = await parseFileBuffer({ buffer: file.buffer, fileName: file.originalname });
  const rows = data.map((r: any) =>
    Object.fromEntries(Object.entries(r).map(([k, v]) => [k, String(v ?? "")]))
  );
  return buildPreview(rows);
};

export const previewSheet = async (
  googleSheetUrl: string,
  accessToken: string,
) => {
  const { spreadsheetId } = parseGoogleSheetUrl(googleSheetUrl);
  if (!spreadsheetId) throw new AppError("URL Google Sheets không hợp lệ.", 400);

  const result = await parseGoogleSheet(googleSheetUrl, accessToken);
  const preview = buildPreview(result.rows);
  return {
    ...preview,
    sheetName: result.sheetName,
    sheetId: result.sheetId,
  };
};

/**
 *
 * Orchestrates the full "send campaign" pipeline:
 * 1. Parse file or Google Sheet -> raw contacts
 * 2. Validate & filter contacts (Zod)
 * 3. Create Campaign record (status: PROCESSING)
 * 4. Bulk insert MailLogs (status: QUEUED)
 * 5. Bulk push jobs to BullMQ
 * 6. Return campaignId immediately (async processing begins in background)
 */

function renderTemplate(template: string, row: Record<string, string>): string {
  return template.replace(/\{\{(.+?)\}\}/g, (_, key) => {
    const trimmed = key.trim();
    return row[trimmed] !== undefined ? row[trimmed] : `{{${trimmed}}}`;
  });
}

interface SendCampaignOptions {
  body: Record<string, any>;
  file?: Express.Multer.File;
  userEmail: string;
  accessToken: string;
}

export const sendCampaign = async (options: SendCampaignOptions) => {
  const { body, file, userEmail, accessToken } = options;

  // ── Step 1: Validate campaign metadata (name, subject, htmlBody) ──────────
  const parsed = CreateCampaignSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError(
      parsed.error.issues.map((e) => e.message).join(", "),
      400,
    );
  }
  const { name, subject, htmlBody, googleSheetUrl, emailColumn, sheetName, sheetId } = parsed.data;

  // ── Step 2: Parse contacts from file or Google Sheet ─────────────────────
  let rawData: any[] = [];
  let resolvedSheetName = sheetName;
  let resolvedSheetId = sheetId;
  let isGoogleSheet = false;

  if (file) {
    logger.info("Parsing uploaded file", { filename: file.originalname });
    rawData = await parseFileBuffer({
      buffer: file.buffer,
      fileName: file.originalname,
    });
  } else if (googleSheetUrl) {
    isGoogleSheet = true;
    logger.info("Parsing Google Sheet", { url: googleSheetUrl });

    await upsertUserToken(userEmail, accessToken);

    const result = await parseGoogleSheet(googleSheetUrl, accessToken);
    rawData = result.rows;
    resolvedSheetName = result.sheetName;
    resolvedSheetId = result.sheetId;
  } else {
    throw new AppError(
      "Vui lòng upload file (Excel/CSV) hoặc cung cấp Google Sheet URL.",
      400,
    );
  }

  // ── Step 3: Validate & filter contacts ───────────────────────────────────
  const { valid: contacts, invalidCount } = validateAndFilterContacts(rawData, emailColumn);

  if (contacts.length === 0) {
    throw new AppError(
      `Không tìm thấy email hợp lệ nào. ${invalidCount} dòng bị loại bỏ.`,
      400,
    );
  }

  // ── Step 3.5: Check Quota & Upsert Contacts ──────────────────────────────
  await checkAndIncrementQuota(contacts.length);

  await Promise.all(
    contacts.map((c) =>
      prisma.marketingContact.upsert({
        where: { email: c.email },
        update: { fullName: c.name ?? null },
        create: { email: c.email, fullName: c.name ?? null },
      })
    )
  );

  // ── Step 4: Create Campaign record ────────────────────────────────────────
  const campaign = await createCampaign({
    name,
    subject,
    htmlBody,
    totalEmails: contacts.length,
    createdBy: userEmail,
  });

  // Cập nhật thông tin Google Sheet cho campaign
  if (isGoogleSheet && googleSheetUrl) {
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        googleSheetUrl,
        sheetName: resolvedSheetName ?? null,
        sheetId: resolvedSheetId ?? null,
      },
    });
  }

  // ── Step 5: Bulk insert MailLogs (status: QUEUED) với rowIndex ──────────
  const rawStringRows: Record<string, string>[] = rawData.map((r: any) =>
    Object.fromEntries(Object.entries(r).map(([k, v]) => [k, String(v ?? "")]))
  );

  const validRowIndices: number[] = [];
  const validRows: Record<string, string>[] = [];
  for (let ri = 0; ri < rawStringRows.length; ri++) {
    const row = rawStringRows[ri]!;
    const testRow: Record<string, string> = {};
    for (const key in row) {
      const lowerKey = key.trim().toLowerCase();
      if (emailColumn && lowerKey === emailColumn.trim().toLowerCase()) {
        testRow.email = row[key]!;
      } else if (!emailColumn && (lowerKey === "email" || lowerKey === "thư điện tử" || lowerKey === "e-mail")) {
        testRow.email = row[key]!;
      }
      testRow[key] = row[key]!;
    }
    const result = ContactSchema.safeParse(testRow);
    if (result.success) {
      validRows.push(row);
      validRowIndices.push(ri);
    }
  }

  await bulkCreateMailLogs(
    contacts.map((c, i) => {
      const log: {
        campaignId: string;
        recipientEmail: string;
        recipientName?: string;
        rowIndex?: number | null;
      } = {
        campaignId: campaign.id,
        recipientEmail: c.email,
      };
      if (c.name !== undefined) log.recipientName = c.name;
      if (isGoogleSheet && i < validRowIndices.length) {
        log.rowIndex = validRowIndices[i]!;
      }
      return log;
    }),
  );

  // ── Step 6: Fetch created MailLog IDs and push to BullMQ ─────────────────
  const mailLogs = await getMailLogsForQueue(campaign.id);

  const spreadsheetId = googleSheetUrl
    ? parseGoogleSheetUrl(googleSheetUrl).spreadsheetId
    : null;

  const safeSubject = subject ?? "";
  const safeHtml = htmlBody ?? "";
  const jobsAdded = await addBulkEmailJobs(
    mailLogs.map((log, i) => {
      const row = validRows[i] ?? {};
      const job: {
        logId: string;
        campaignId: string;
        to: string;
        subject: string;
        html: string;
        recipientName?: string;
        sheetUpdateInfo?: {
          spreadsheetId: string;
          sheetName: string;
          rowIndex: number;
          userEmail: string;
        };
      } = {
        logId: log.id,
        campaignId: campaign.id,
        to: log.recipientEmail,
        subject: renderTemplate(safeSubject, row),
        html: renderTemplate(safeHtml, row),
      };
      if (log.recipientName !== null && log.recipientName !== undefined) {
        job.recipientName = log.recipientName;
      }
      if (isGoogleSheet && spreadsheetId && resolvedSheetName && log.rowIndex != null) {
        job.sheetUpdateInfo = {
          spreadsheetId,
          sheetName: resolvedSheetName,
          rowIndex: log.rowIndex,
          userEmail,
        };
      }
      return job;
    }),
  );

  logger.info("Campaign queued", {
    campaignId: campaign.id,
    jobsAdded,
    invalidSkipped: invalidCount,
    isGoogleSheet,
  });

  return {
    campaignId: campaign.id,
    totalQueued: contacts.length,
    invalidSkipped: invalidCount,
  };
};

/**
 * Cancel a running campaign.
 * Workers check this status before sending each email.
 */
export const cancelCampaign = async (campaignId: string, userEmail: string) => {
  const campaign = await findCampaignById(campaignId);

  if (!campaign) {
    throw new AppError("Không tìm thấy chiến dịch.", 404);
  }

  if (campaign.createdBy !== userEmail) {
    throw new AppError("Bạn không có quyền huỷ chiến dịch này.", 403);
  }

  if (campaign.status === "COMPLETED" || campaign.status === "CANCELLED") {
    throw new AppError(
      `Không thể huỷ chiến dịch đang ở trạng thái ${campaign.status}.`,
      400,
    );
  }

  await updateCampaignStatus(campaignId, "CANCELLED");

  // Đánh dấu tất cả mail còn QUEUED thành CANCELLED
  await prisma.mailLog.updateMany({
    where: { campaignId, status: "QUEUED" },
    data: { status: "CANCELLED" },
  });

  // Kiểm tra nếu tất cả mail đã được xử lý
  const [current, cancelledCount] = await Promise.all([
    prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { sentCount: true, failedCount: true, totalEmails: true },
    }),
    prisma.mailLog.count({
      where: { campaignId, status: "CANCELLED" },
    }),
  ]);

  if (current) {
    const totalProcessed = current.sentCount + current.failedCount + cancelledCount;
    const isAllDone = totalProcessed >= current.totalEmails;
    if (isAllDone) {
      const newStatus = current.sentCount > 0 ? "COMPLETED" : "FAILED";
      await updateCampaignStatus(campaignId, newStatus);
      emitProgressUpdate(campaignId, {
        sent: current.sentCount,
        failed: current.failedCount,
        total: current.totalEmails,
        status: newStatus,
      });
    } else {
      emitProgressUpdate(campaignId, {
        sent: current.sentCount,
        failed: current.failedCount,
        total: current.totalEmails,
        status: "CANCELLED",
      });
    }
  }

  logger.info("Campaign cancelled", { campaignId, by: userEmail });

  return { campaignId, status: "CANCELLED" };
};

/**
 * Continue a campaign: re-read the Google Sheet, find new emails not yet sent,
 * and queue them for delivery. Only works for campaigns with googleSheetUrl.
 */
export const continueCampaign = async (
  campaignId: string,
  userEmail: string,
  accessToken: string,
) => {
  const campaign = await findCampaignById(campaignId);
  if (!campaign) throw new AppError("Không tìm thấy chiến dịch.", 404);
  if (campaign.createdBy !== userEmail) throw new AppError("Bạn không có quyền truy cập.", 403);
  if (!campaign.googleSheetUrl || !campaign.sheetName) {
    throw new AppError("Chiến dịch này không sử dụng Google Sheet.", 400);
  }

  await upsertUserToken(userEmail, accessToken);

  const result = await parseGoogleSheet(campaign.googleSheetUrl, accessToken);
  const rawData = result.rows;

  const { valid: contacts } = validateAndFilterContacts(rawData);

  const existingEmails = await prisma.mailLog.findMany({
    where: { campaignId },
    select: { recipientEmail: true },
    distinct: ["recipientEmail"],
  });
  const existingSet = new Set(existingEmails.map((e) => e.recipientEmail));

  const newContacts = contacts.filter((c) => !existingSet.has(c.email));

  if (newContacts.length === 0) {
    return { campaignId, newQueued: 0, alreadySent: existingSet.size, message: "Không có email mới để gửi." };
  }

  const subject = campaign.subject;
  const htmlBody = campaign.htmlBody;

  await checkAndIncrementQuota(newContacts.length);

  await bulkCreateMailLogs(
    newContacts.map((c) => ({
      campaignId,
      recipientEmail: c.email,
      recipientName: c.name ?? null,
    })),
  );

  const stringRows: Record<string, string>[] = rawData.map((r: any) =>
    Object.fromEntries(Object.entries(r).map(([k, v]) => [k, String(v ?? "")]))
  );

  const validRows: Record<string, string>[] = [];
  for (const row of stringRows) {
    const testRow: Record<string, string> = {};
    for (const key in row) {
      const lowerKey = key.trim().toLowerCase();
      if (lowerKey === "email" || lowerKey === "thư điện tử" || lowerKey === "e-mail") {
        testRow.email = row[key]!;
      }
      testRow[key] = row[key]!;
    }
    const parsed = ContactSchema.safeParse(testRow);
    if (parsed.success) validRows.push(row);
  }

  const newEmailSet = new Set(newContacts.map((c) => c.email));
  const newValidRows = validRows.filter((r) => {
    for (const key in r) {
      const lowerKey = key.trim().toLowerCase();
      if (lowerKey === "email" || lowerKey === "thư điện tử" || lowerKey === "e-mail") {
        return newEmailSet.has(r[key]!);
      }
    }
    return false;
  });

  const mailLogs = await getMailLogsForQueue(campaign.id);
  const newMailLogs = mailLogs.filter((ml) => newEmailSet.has(ml.recipientEmail));

  const safeSubject = subject ?? "";
  const safeHtml = htmlBody ?? "";
  await addBulkEmailJobs(
    newMailLogs.map((log, i) => {
      const row = newValidRows[i] ?? {};
      const job: {
        logId: string;
        campaignId: string;
        to: string;
        subject: string;
        html: string;
        recipientName?: string;
      } = {
        logId: log.id,
        campaignId,
        to: log.recipientEmail,
        subject: renderTemplate(safeSubject, row),
        html: renderTemplate(safeHtml, row),
      };
      if (log.recipientName !== null && log.recipientName !== undefined) {
        job.recipientName = log.recipientName;
      }
      return job;
    }),
  );

  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      totalEmails: { increment: newContacts.length },
      status: "PROCESSING",
    },
  });

  logger.info("Campaign continued", {
    campaignId,
    newQueued: newContacts.length,
    alreadySent: existingSet.size,
  });

  return {
    campaignId,
    newQueued: newContacts.length,
    alreadySent: existingSet.size,
  };
};

/**
 * Batch sync all mail log statuses to the Google Sheet.
 */
export const syncCampaignToSheet = async (
  campaignId: string,
  userEmail: string,
  accessToken: string,
) => {
  const campaign = await findCampaignById(campaignId);
  if (!campaign) throw new AppError("Không tìm thấy chiến dịch.", 404);
  if (campaign.createdBy !== userEmail) throw new AppError("Bạn không có quyền truy cập.", 403);
  if (!campaign.googleSheetUrl || !campaign.sheetName) {
    throw new AppError("Chiến dịch này không sử dụng Google Sheet.", 400);
  }

  const { spreadsheetId } = parseGoogleSheetUrl(campaign.googleSheetUrl);
  if (!spreadsheetId) throw new AppError("URL Google Sheet không hợp lệ.", 400);

  const logs = await prisma.mailLog.findMany({
    where: {
      campaignId,
      rowIndex: { not: null },
    },
    select: { rowIndex: true, status: true },
  });

  const updates = logs
    .filter((l) => l.rowIndex !== null)
    .map((l) => ({
      rowIndex: l.rowIndex!,
      status: l.status,
    }));

  await batchUpdateSheetStatuses(
    spreadsheetId,
    campaign.sheetName,
    accessToken,
    updates,
  );

  return { updated: updates.length };
};

/**
 * Get all campaigns for the authenticated user.
 */
export const getCampaigns = async (userEmail: string) => {
  return listCampaigns(userEmail);
};

/**
 * Get a single campaign by ID (with ownership check).
 */
export const getCampaign = async (campaignId: string, userEmail: string) => {
  const campaign = await findCampaignById(campaignId);
  if (!campaign) throw new AppError("Không tìm thấy chiến dịch.", 404);
  if (campaign.createdBy !== userEmail) throw new AppError("Bạn không có quyền xem chiến dịch này.", 403);
  return campaign;
};
