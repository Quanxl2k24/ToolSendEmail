import { z } from "zod";

// Regex: RFC 5322 đơn giản hóa để validate email
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Schema validate cho một record email trong danh sách.
 * Chỉ các record có email hợp lệ mới được đưa vào Queue.
 */
export const ContactSchema = z.object({
  email: z
    .string()
    .min(1, "Email không được để trống")
    .regex(emailRegex, "Định dạng email không hợp lệ"),
  name: z.string().optional(),
});

export type ContactDto = z.infer<typeof ContactSchema>;

/**
 * Schema validate cho request tạo Campaign mới.
 */
export const CreateCampaignSchema = z.object({
  name: z
    .string()
    .min(1, "Tên chiến dịch không được để trống")
    .max(255),
  subject: z
    .string()
    .min(1, "Tiêu đề email không được để trống")
    .max(500),
  htmlBody: z
    .string()
    .min(1, "Nội dung HTML không được để trống"),
  emailColumn: z
    .string()
    .min(1, "Vui lòng chọn cột chứa email")
    .optional(),
  googleSheetUrl: z
    .string()
    .url("URL Google Sheet không hợp lệ")
    .optional(),
  sheetName: z
    .string()
    .optional(),
  sheetId: z
    .number()
    .optional(),
});

export type CreateCampaignDto = z.infer<typeof CreateCampaignSchema>;

/**
 * Validates and filters an array of raw data rows.
 * Returns only the valid rows (with proper email fields) and a list of invalid ones.
 */
export const validateAndFilterContacts = (
  rawData: any[],
  emailColumn?: string,
): {
  valid: ContactDto[];
  invalidCount: number;
} => {
  const valid: ContactDto[] = [];
  let invalidCount = 0;

  for (const row of rawData) {
    const normalizedRow: Record<string, string> = {};

    for (const key in row) {
      const lowerKey = key.trim().toLowerCase();
      const value = String(row[key] ?? "");

      if (emailColumn && lowerKey === emailColumn.trim().toLowerCase()) {
        normalizedRow.email = value;
      } else if (!emailColumn && (lowerKey === "email" || lowerKey === "thư điện tử" || lowerKey === "e-mail")) {
        normalizedRow.email = value;
      } else if (lowerKey === "name" || lowerKey === "tên" || lowerKey === "họ tên" || lowerKey === "họ và tên") {
        normalizedRow.name = value;
      }

      normalizedRow[key] = value;
    }

    const result = ContactSchema.safeParse(normalizedRow);
    if (result.success) {
      valid.push(result.data);
    } else {
      invalidCount++;
    }
  }

  return { valid, invalidCount };
};
