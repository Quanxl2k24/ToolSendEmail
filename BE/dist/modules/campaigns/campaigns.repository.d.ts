import type { CampaignStatus } from "@prisma/client";
/**
 * campaigns.repository.ts
 *
 * Encapsulates all direct database interactions for Campaigns and MailLogs.
 * The Service layer should only interact with the DB through this Repository.
 */
export declare const createCampaign: (data: {
    name: string;
    subject: string;
    htmlBody: string;
    totalEmails: number;
    createdBy: string;
}) => Promise<{
    status: import("@prisma/client").$Enums.CampaignStatus;
    name: string;
    subject: string;
    htmlBody: string;
    id: string;
    totalEmails: number;
    sentCount: number;
    failedCount: number;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare const findCampaignById: (id: string) => Promise<{
    status: import("@prisma/client").$Enums.CampaignStatus;
    name: string;
    subject: string;
    htmlBody: string;
    id: string;
    totalEmails: number;
    sentCount: number;
    failedCount: number;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
} | null>;
export declare const updateCampaignStatus: (id: string, status: CampaignStatus) => Promise<{
    status: import("@prisma/client").$Enums.CampaignStatus;
    name: string;
    subject: string;
    htmlBody: string;
    id: string;
    totalEmails: number;
    sentCount: number;
    failedCount: number;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare const listCampaigns: (createdBy: string) => Promise<{
    status: import("@prisma/client").$Enums.CampaignStatus;
    name: string;
    subject: string;
    id: string;
    totalEmails: number;
    sentCount: number;
    failedCount: number;
    createdAt: Date;
}[]>;
/**
 * Bulk-inserts all email recipients as MailLog records with QUEUED status.
 * Much more efficient than inserting one at a time.
 */
export declare const bulkCreateMailLogs: (logs: Array<{
    campaignId: string;
    recipientEmail: string;
    recipientName?: string;
}>) => Promise<import("@prisma/client").Prisma.BatchPayload>;
/**
 * Fetch all MailLogs for a campaign (for reporting).
 */
export declare const getMailLogsByCampaign: (campaignId: string) => Promise<{
    status: import("@prisma/client").$Enums.MailLogStatus;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    campaignId: string;
    recipientEmail: string;
    recipientName: string | null;
    awsMessageId: string | null;
    errorMessage: string | null;
    sentAt: Date | null;
}[]>;
/**
 * Fetch all MailLog IDs and emails for a campaign (for building queue jobs).
 */
export declare const getMailLogsForQueue: (campaignId: string) => Promise<{
    id: string;
    recipientEmail: string;
    recipientName: string | null;
}[]>;
//# sourceMappingURL=campaigns.repository.d.ts.map