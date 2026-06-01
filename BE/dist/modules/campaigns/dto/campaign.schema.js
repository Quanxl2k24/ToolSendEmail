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
    // googleSheetUrl nếu có (thay thế cho file upload)
    googleSheetUrl: z
        .string()
        .url("URL Google Sheet không hợp lệ")
        .optional(),
});
/**
 * Validates and filters an array of raw data rows.
 * Returns only the valid rows (with proper email fields) and a list of invalid ones.
 */
export const validateAndFilterContacts = (rawData) => {
    const valid = [];
    let invalidCount = 0;
    for (const row of rawData) {
        // Tiền xử lý: Chuyển các key thành lowercase và map về đúng 'email' và 'name'
        const normalizedRow = {};
        for (const key in row) {
            const lowerKey = key.trim().toLowerCase();
            if (lowerKey === "email" || lowerKey === "thư điện tử" || lowerKey === "e-mail") {
                normalizedRow.email = row[key];
            }
            else if (lowerKey === "name" || lowerKey === "tên" || lowerKey === "họ tên" || lowerKey === "họ và tên") {
                normalizedRow.name = row[key];
            }
            else {
                // Giữ lại các cột khác để có thể dùng làm biến động
                normalizedRow[key] = row[key];
            }
        }
        const result = ContactSchema.safeParse(normalizedRow);
        if (result.success) {
            valid.push(result.data);
        }
        else {
            invalidCount++;
        }
    }
    return { valid, invalidCount };
};
//# sourceMappingURL=campaign.schema.js.map