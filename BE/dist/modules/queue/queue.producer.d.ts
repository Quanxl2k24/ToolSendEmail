import { Queue } from "bullmq";
/**
 * EmailJobData: Dữ liệu của mỗi Job trong Queue.
 * Chỉ lưu trữ đủ thông tin để Worker xử lý, tránh nhét dữ liệu lớn vào Redis.
 */
export interface EmailJobData {
    logId: string;
    campaignId: string;
    to: string;
    subject: string;
    html: string;
    recipientName?: string;
    sheetUpdateInfo?: {
        spreadsheetId: string;
        sheetName: string;
        rowIndex: number;
        userEmail: string;
    };
}
/**
 * Returns the singleton BullMQ Queue instance.
 * The Queue is configured with a rate limiter to prevent ESP from blocking our IP.
 * Rate limit: max 10 emails/second.
 */
export declare const getEmailQueue: () => Queue<EmailJobData>;
/**
 * Đẩy hàng loạt email jobs vào Queue cùng một lúc (efficient bulk insert).
 *
 * @param jobs - Array of EmailJobData
 * @returns Number of jobs added
 */
export declare const addBulkEmailJobs: (jobs: EmailJobData[]) => Promise<number>;
//# sourceMappingURL=queue.producer.d.ts.map