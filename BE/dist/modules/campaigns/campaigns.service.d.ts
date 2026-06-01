/**
 * campaigns.service.ts
 *
 * Orchestrates the full "send campaign" pipeline:
 * 1. Parse file or Google Sheet -> raw contacts
 * 2. Validate & filter contacts (Zod)
 * 3. Create Campaign record (status: PROCESSING)
 * 4. Bulk insert MailLogs (status: QUEUED)
 * 5. Bulk push jobs to BullMQ
 * 6. Return campaignId immediately (async processing begins in background)
 */
interface SendCampaignOptions {
    body: Record<string, any>;
    file?: Express.Multer.File;
    userEmail: string;
    accessToken: string;
}
export declare const sendCampaign: (options: SendCampaignOptions) => Promise<{
    campaignId: string;
    totalQueued: number;
    invalidSkipped: number;
}>;
/**
 * Cancel a running campaign.
 * Workers check this status before sending each email.
 */
export declare const cancelCampaign: (campaignId: string, userEmail: string) => Promise<{
    campaignId: string;
    status: string;
}>;
/**
 * Get all campaigns for the authenticated user.
 */
export declare const getCampaigns: (userEmail: string) => Promise<{
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
 * Get a single campaign by ID (with ownership check).
 */
export declare const getCampaign: (campaignId: string, userEmail: string) => Promise<{
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
export {};
//# sourceMappingURL=campaigns.service.d.ts.map