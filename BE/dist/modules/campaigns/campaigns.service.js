import { CreateCampaignSchema, validateAndFilterContacts, } from "./dto/campaign.schema.js";
import { createCampaign, bulkCreateMailLogs, getMailLogsForQueue, updateCampaignStatus, listCampaigns, findCampaignById, } from "./campaigns.repository.js";
import { addBulkEmailJobs } from "../queue/queue.producer.js";
import { parseFileBuffer } from "../../core/utils/excel.util.js";
import { parseGoogleSheet } from "../../core/utils/googleSheets.util.js";
import { AppError } from "../../core/exceptions/appError.js";
import { logger } from "../../core/utils/logger.js";
import { checkAndIncrementQuota } from "./quota.service.js";
import prisma from "../../core/database/prisma.service.js";
export const sendCampaign = async (options) => {
    const { body, file, userEmail, accessToken } = options;
    // ── Step 1: Validate campaign metadata (name, subject, htmlBody) ──────────
    const parsed = CreateCampaignSchema.safeParse(body);
    if (!parsed.success) {
        throw new AppError(parsed.error.issues.map((e) => e.message).join(", "), 400);
    }
    const { name, subject, htmlBody, googleSheetUrl } = parsed.data;
    // ── Step 2: Parse contacts from file or Google Sheet ─────────────────────
    let rawData = [];
    if (file) {
        logger.info("Parsing uploaded file", { filename: file.originalname });
        rawData = await parseFileBuffer({
            buffer: file.buffer,
            fileName: file.originalname,
        });
    }
    else if (googleSheetUrl) {
        logger.info("Parsing Google Sheet", { url: googleSheetUrl });
        rawData = await parseGoogleSheet(googleSheetUrl, accessToken);
    }
    else {
        throw new AppError("Vui lòng upload file (Excel/CSV) hoặc cung cấp Google Sheet URL.", 400);
    }
    // Debug: Log the raw data parsed from the file/sheet
    console.log("==== RAW DATA PARSED ====");
    console.log(JSON.stringify(rawData, null, 2));
    console.log("=========================");
    // ── Step 3: Validate & filter contacts ───────────────────────────────────
    const { valid: contacts, invalidCount } = validateAndFilterContacts(rawData);
    if (contacts.length === 0) {
        throw new AppError(`Không tìm thấy email hợp lệ nào. ${invalidCount} dòng bị loại bỏ.`, 400);
    }
    logger.info("Contacts validated", {
        valid: contacts.length,
        invalid: invalidCount,
    });
    // Debug: Log the valid contacts after filtering
    console.log("==== VALID CONTACTS ====");
    console.log(JSON.stringify(contacts, null, 2));
    console.log("========================");
    // ── Step 3.5: Check Quota & Upsert Contacts ──────────────────────────────
    await checkAndIncrementQuota(contacts.length);
    // Upsert into MarketingContacts
    await Promise.all(contacts.map((c) => prisma.marketingContact.upsert({
        where: { email: c.email },
        update: { fullName: c.name ?? null },
        create: { email: c.email, fullName: c.name ?? null },
    })));
    // ── Step 4: Create Campaign record ────────────────────────────────────────
    const campaign = await createCampaign({
        name,
        subject,
        htmlBody,
        totalEmails: contacts.length,
        createdBy: userEmail,
    });
    // ── Step 5: Bulk insert MailLogs (status: QUEUED) ─────────────────────────
    // exactOptionalPropertyTypes: only set recipientName if it has a value
    await bulkCreateMailLogs(contacts.map((c) => {
        const log = {
            campaignId: campaign.id,
            recipientEmail: c.email,
        };
        if (c.name !== undefined)
            log.recipientName = c.name;
        return log;
    }));
    // ── Step 6: Fetch created MailLog IDs and push to BullMQ ─────────────────
    const mailLogs = await getMailLogsForQueue(campaign.id);
    const jobsAdded = await addBulkEmailJobs(mailLogs.map((log) => {
        const job = {
            logId: log.id,
            campaignId: campaign.id,
            to: log.recipientEmail,
            subject,
            html: htmlBody,
        };
        if (log.recipientName !== null && log.recipientName !== undefined) {
            job.recipientName = log.recipientName;
        }
        return job;
    }));
    logger.info("Campaign queued", {
        campaignId: campaign.id,
        jobsAdded,
        invalidSkipped: invalidCount,
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
export const cancelCampaign = async (campaignId, userEmail) => {
    const campaign = await findCampaignById(campaignId);
    if (!campaign) {
        throw new AppError("Không tìm thấy chiến dịch.", 404);
    }
    if (campaign.createdBy !== userEmail) {
        throw new AppError("Bạn không có quyền huỷ chiến dịch này.", 403);
    }
    if (campaign.status === "COMPLETED" || campaign.status === "CANCELLED") {
        throw new AppError(`Không thể huỷ chiến dịch đang ở trạng thái ${campaign.status}.`, 400);
    }
    await updateCampaignStatus(campaignId, "CANCELLED");
    logger.info("Campaign cancelled", { campaignId, by: userEmail });
    return { campaignId, status: "CANCELLED" };
};
/**
 * Get all campaigns for the authenticated user.
 */
export const getCampaigns = async (userEmail) => {
    return listCampaigns(userEmail);
};
/**
 * Get a single campaign by ID (with ownership check).
 */
export const getCampaign = async (campaignId, userEmail) => {
    const campaign = await findCampaignById(campaignId);
    if (!campaign)
        throw new AppError("Không tìm thấy chiến dịch.", 404);
    if (campaign.createdBy !== userEmail)
        throw new AppError("Bạn không có quyền xem chiến dịch này.", 403);
    return campaign;
};
//# sourceMappingURL=campaigns.service.js.map