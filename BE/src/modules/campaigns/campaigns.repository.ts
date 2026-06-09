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
  type?: "ONE_SHOT" | "SCHEDULED";
  startTime?: Date | null;
  endTime?: Date | null;
}) => {
  const status = data.type === "SCHEDULED" ? "PENDING" : "PROCESSING";
  return prisma.campaign.create({
    data: {
      name: data.name,
      subject: data.subject,
      htmlBody: data.htmlBody,
      totalEmails: data.totalEmails,
      createdBy: data.createdBy,
      type: data.type ?? "ONE_SHOT",
      startTime: data.startTime ?? null,
      endTime: data.endTime ?? null,
      status,
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
      type: true,
      totalEmails: true,
      sentCount: true,
      failedCount: true,
      startTime: true,
      endTime: true,
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

export const findScheduledCampaignsToActivate = async (now: Date) => {
  return prisma.campaign.findMany({
    where: {
      type: "SCHEDULED",
      status: "PENDING",
      startTime: { lte: now },
    },
  });
};

export const findActiveScheduledCampaigns = async (now: Date) => {
  return prisma.campaign.findMany({
    where: {
      type: "SCHEDULED",
      status: "PROCESSING",
      startTime: { lte: now },
      endTime: { gte: now },
    },
  });
};

export const findExpiredScheduledCampaigns = async (now: Date) => {
  return prisma.campaign.findMany({
    where: {
      type: "SCHEDULED",
      status: "PROCESSING",
      endTime: { lt: now },
    },
  });
};

export const updateCampaignField = async (id: string, data: Record<string, any>) => {
  return prisma.campaign.update({ where: { id }, data });
};
