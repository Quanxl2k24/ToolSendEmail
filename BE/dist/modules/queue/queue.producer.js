import { Queue } from "bullmq";
import { getRedisConnection, EMAIL_QUEUE_NAME } from "./queue.config.js";
let emailQueue = null;
/**
 * Returns the singleton BullMQ Queue instance.
 * The Queue is configured with a rate limiter to prevent ESP from blocking our IP.
 * Rate limit: max 10 emails/second.
 */
export const getEmailQueue = () => {
    if (emailQueue)
        return emailQueue;
    emailQueue = new Queue(EMAIL_QUEUE_NAME, {
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
export const addBulkEmailJobs = async (jobs) => {
    const queue = getEmailQueue();
    const bulkJobs = jobs.map((data) => ({
        name: "send-email",
        data,
    }));
    const addedJobs = await queue.addBulk(bulkJobs);
    return addedJobs.length;
};
//# sourceMappingURL=queue.producer.js.map