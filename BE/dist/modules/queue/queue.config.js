import { Redis } from "ioredis";
import { logger } from "../../core/utils/logger.js";
/**
 * queue.config.ts
 *
 * Creates and exports a shared Redis connection for BullMQ.
 * BullMQ requires a dedicated connection (not shared with other ioredis instances).
 *
 * Required ENV: REDIS_HOST, REDIS_PORT, REDIS_PASSWORD (optional)
 */
let redisConnection = null;
export const getRedisConnection = () => {
    if (redisConnection)
        return redisConnection;
    redisConnection = new Redis({
        host: process.env.REDIS_HOST ?? "127.0.0.1",
        port: Number(process.env.REDIS_PORT ?? 6379),
        password: process.env.REDIS_PASSWORD ?? undefined,
        maxRetriesPerRequest: null, // Required by BullMQ
    });
    redisConnection.on("connect", () => logger.info("Redis connected."));
    redisConnection.on("error", (err) => logger.error("Redis connection error", { error: String(err) }));
    return redisConnection;
};
// Queue name constant – used by both producer and worker
export const EMAIL_QUEUE_NAME = "email-send";
//# sourceMappingURL=queue.config.js.map