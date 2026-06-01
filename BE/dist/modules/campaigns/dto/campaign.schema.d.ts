import { z } from "zod";
/**
 * Schema validate cho một record email trong danh sách.
 * Chỉ các record có email hợp lệ mới được đưa vào Queue.
 */
export declare const ContactSchema: z.ZodObject<{
    email: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type ContactDto = z.infer<typeof ContactSchema>;
/**
 * Schema validate cho request tạo Campaign mới.
 */
export declare const CreateCampaignSchema: z.ZodObject<{
    name: z.ZodString;
    subject: z.ZodString;
    htmlBody: z.ZodString;
    googleSheetUrl: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CreateCampaignDto = z.infer<typeof CreateCampaignSchema>;
/**
 * Validates and filters an array of raw data rows.
 * Returns only the valid rows (with proper email fields) and a list of invalid ones.
 */
export declare const validateAndFilterContacts: (rawData: any[]) => {
    valid: ContactDto[];
    invalidCount: number;
};
//# sourceMappingURL=campaign.schema.d.ts.map