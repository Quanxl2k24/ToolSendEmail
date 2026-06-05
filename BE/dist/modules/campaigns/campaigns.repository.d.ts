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
    name: string;
    id: string;
    subject: string;
    htmlBody: string;
    status: import("@prisma/client").$Enums.CampaignStatus;
    totalEmails: number;
    sentCount: number;
    failedCount: number;
    createdBy: string;
    googleSheetUrl: string | null;
    sheetName: string | null;
    sheetId: number | null;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare const findCampaignById: (id: string) => Promise<{
    name: string;
    id: string;
    subject: string;
    htmlBody: string;
    status: import("@prisma/client").$Enums.CampaignStatus;
    totalEmails: number;
    sentCount: number;
    failedCount: number;
    createdBy: string;
    googleSheetUrl: string | null;
    sheetName: string | null;
    sheetId: number | null;
    createdAt: Date;
    updatedAt: Date;
} | null>;
export declare const updateCampaignStatus: (id: string, status: CampaignStatus) => Promise<{
    name: string;
    id: string;
    subject: string;
    htmlBody: string;
    status: import("@prisma/client").$Enums.CampaignStatus;
    totalEmails: number;
    sentCount: number;
    failedCount: number;
    createdBy: string;
    googleSheetUrl: string | null;
    sheetName: string | null;
    sheetId: number | null;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare const listCampaigns: (createdBy: string) => Promise<{
    name: string;
    id: string;
    subject: string;
    status: import("@prisma/client").$Enums.CampaignStatus;
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
    recipientName?: string | null;
    rowIndex?: number | null;
}>) => Promise<import("@prisma/client").Prisma.BatchPayload>;
/**
 * Fetch all MailLogs for a campaign (for reporting).
 */
export declare const getMailLogsByCampaign: (campaignId: string) => Promise<{
    id: string;
    status: import("@prisma/client").$Enums.MailLogStatus;
    createdAt: Date;
    updatedAt: Date;
    campaignId: string;
    recipientEmail: string;
    recipientName: string | null;
    messageId: string | null;
    errorMessage: string | null;
    rowIndex: number | null;
    sentAt: Date | null;
}[]>;
/**
 * Fetch all MailLog IDs and emails for a campaign (for building queue jobs).
 */
export declare const getMailLogsForQueue: (campaignId: string) => Promise<{
    id: string;
    recipientEmail: string;
    recipientName: string | null;
    rowIndex: number | null;
}[]>;
//# sourceMappingURL=campaigns.repository.d.ts.map