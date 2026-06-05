import prisma from "../../core/database/prisma.service.js";
/**
 * campaigns.repository.ts
 *
 * Encapsulates all direct database interactions for Campaigns and MailLogs.
 * The Service layer should only interact with the DB through this Repository.
 */
// ─── Campaign Queries ─────────────────────────────────────────────────────────
export const createCampaign = async (data) => {
    return prisma.campaign.create({
        data: {
            ...data,
            status: "PROCESSING",
        },
    });
};
export const findCampaignById = async (id) => {
    return prisma.campaign.findUnique({ where: { id } });
};
export const updateCampaignStatus = async (id, status) => {
    return prisma.campaign.update({ where: { id }, data: { status } });
};
export const listCampaigns = async (createdBy) => {
    return prisma.campaign.findMany({
        where: { createdBy },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            name: true,
            subject: true,
            status: true,
            totalEmails: true,
            sentCount: true,
            failedCount: true,
            createdAt: true,
        },
    });
};
// ─── MailLog Queries ──────────────────────────────────────────────────────────
/**
 * Bulk-inserts all email recipients as MailLog records with QUEUED status.
 * Much more efficient than inserting one at a time.
 */
export const bulkCreateMailLogs = async (logs) => {
    return prisma.mailLog.createMany({
        data: logs.map((log) => ({
            campaignId: log.campaignId,
            recipientEmail: log.recipientEmail,
            recipientName: log.recipientName ?? null,
            rowIndex: log.rowIndex ?? null,
            status: "QUEUED",
        })),
        skipDuplicates: false,
    });
};
/**
 * Fetch all MailLogs for a campaign (for reporting).
 */
export const getMailLogsByCampaign = async (campaignId) => {
    return prisma.mailLog.findMany({
        where: { campaignId },
        orderBy: { createdAt: "asc" },
    });
};
/**
 * Fetch all MailLog IDs and emails for a campaign (for building queue jobs).
 */
export const getMailLogsForQueue = async (campaignId) => {
    return prisma.mailLog.findMany({
        where: { campaignId, status: "QUEUED" },
        select: { id: true, recipientEmail: true, recipientName: true, rowIndex: true },
    });
};
//# sourceMappingURL=campaigns.repository.js.map