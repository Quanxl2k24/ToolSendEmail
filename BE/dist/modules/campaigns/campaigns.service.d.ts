export declare const previewFile: (file: Express.Multer.File) => Promise<{
    headers: string[];
    rows: Record<string, string>[];
    total: number;
}>;
export declare const previewSheet: (googleSheetUrl: string, accessToken: string) => Promise<{
    sheetName: string;
    sheetId: number;
    headers: string[];
    rows: Record<string, string>[];
    total: number;
}>;
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
 * Batch sync all mail log statuses to the Google Sheet.
 */
export declare const syncCampaignToSheet: (campaignId: string, userEmail: string, accessToken: string) => Promise<{
    updated: number;
}>;
/**
 * Get all campaigns for the authenticated user.
 */
export declare const getCampaigns: (userEmail: string) => Promise<{
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
 * Get a single campaign by ID (with ownership check).
 */
export declare const getCampaign: (campaignId: string, userEmail: string) => Promise<{
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
export {};
//# sourceMappingURL=campaigns.service.d.ts.map