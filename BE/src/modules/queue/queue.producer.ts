import { Queue } from "bullmq";
import { getRedisConnection, EMAIL_QUEUE_NAME } from "./queue.config.js";

/**
 * EmailJobData: Dữ liệu của mỗi Job trong Queue.
 * Chỉ lưu trữ đủ thông tin để Worker xử lý, tránh nhét dữ liệu lớn vào Redis.
 */
export interface EmailJobData {
  logId: string;        // ID của MailLog record trong DB
  campaignId: string;   // ID của Campaign để check cancel
  to: string;           // Địa chỉ email người nhận
  subject: string;      // Tiêu đề email
  html: string;         // Nội dung HTML (đã được render với biến động)
  recipientName?: string;
  // Thông tin Google Sheets để ghi status
  sheetUpdateInfo?: {
    spreadsheetId: string;
    sheetName: string;
    rowIndex: number;
    userEmail: string;
  };
}

let emailQueue: Queue<EmailJobData> | null = null;

/**
 * Returns the singleton BullMQ Queue instance.
 * The Queue is configured with a rate limiter to prevent ESP from blocking our IP.
 * Rate limit: max 10 emails/second.
 */
export const getEmailQueue = (): Queue<EmailJobData> => {
  if (emailQueue) return emailQueue;

  emailQueue = new Queue<EmailJobData>(EMAIL_QUEUE_NAME, {
    connection: getRedisConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000, // 2s -> 4s -> 8s
      },
      removeOnComplete: { count: 100 }, // Giữ lại 100 job gần nhất để debug
      removeOnFail: { count: 500 },
    },
  });

  return emailQueue;
};

/**
 * Đẩy hàng loạt email jobs vào Queue cùng một lúc (efficient bulk insert).
 *
 * @param jobs - Array of EmailJobData
 * @returns Number of jobs added
 */
export const addBulkEmailJobs = async (
  jobs: EmailJobData[],
): Promise<number> => {
  const queue = getEmailQueue();

  const bulkJobs = jobs.map((data) => ({
    name: "send-email",
    data,
  }));

  const addedJobs = await queue.addBulk(bulkJobs);
  return addedJobs.length;
};
