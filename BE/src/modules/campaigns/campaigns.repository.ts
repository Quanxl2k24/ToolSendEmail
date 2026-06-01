import prisma from "../../core/database/prisma.service.js";
import type { CampaignStatus, MailLogStatus } from "@prisma/client";

/**
 * campaigns.repository.ts
 *
 * Encapsulates all direct database interactions for Campaigns and MailLogs.
 * The Service layer should only interact with the DB through this Repository.
 */

// ─── Campaign Queries ─────────────────────────────────────────────────────────

export const createCampaign = async (data: {
  name: string;
  subject: string;
  htmlBody: string;
  totalEmails: number;
  createdBy: string;
}) => {
  return prisma.campaign.create({
    data: {
      ...data,
      status: "PROCESSING",
    },
  });
};

export const findCampaignById = async (id: string) => {
  return prisma.campaign.findUnique({ where: { id } });
};

export const updateCampaignStatus = async (
  id: string,
  status: CampaignStatus,
) => {
  return prisma.campaign.update({ where: { id }, data: { status } });
};

export const listCampaigns = async (createdBy: string) => {
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
export const bulkCreateMailLogs = async (
  logs: Array<{
    campaignId: string;
    recipientEmail: string;
    recipientName?: string | null;
    rowIndex?: number | null;
  }>,
) => {
  return prisma.mailLog.createMany({
    data: logs.map((log) => ({
      campaignId: log.campaignId,
      recipientEmail: log.recipientEmail,
      recipientName: log.recipientName ?? null,
      rowIndex: log.rowIndex ?? null,
      status: "QUEUED" as MailLogStatus,
    })),
    skipDuplicates: false,
  });
};

/**
 * Fetch all MailLogs for a campaign (for reporting).
 */
export const getMailLogsByCampaign = async (campaignId: string) => {
  return prisma.mailLog.findMany({
    where: { campaignId },
    orderBy: { createdAt: "asc" },
  });
};

/**
 * Fetch all MailLog IDs and emails for a campaign (for building queue jobs).
 */
export const getMailLogsForQueue = async (campaignId: string) => {
  return prisma.mailLog.findMany({
    where: { campaignId, status: "QUEUED" },
    select: { id: true, recipientEmail: true, recipientName: true, rowIndex: true },
  });
};
